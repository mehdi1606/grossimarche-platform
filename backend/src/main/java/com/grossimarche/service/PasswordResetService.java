package com.grossimarche.service;

import com.grossimarche.entity.User;
import com.grossimarche.entity.enums.Role;
import com.grossimarche.entity.enums.UserStatus;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ErrorCode;
import com.grossimarche.exception.RateLimitExceededException;
import com.grossimarche.integration.email.EmailTemplates;
import com.grossimarche.integration.email.Mailer;
import com.grossimarche.repository.UserRepository;
import com.grossimarche.security.RefreshTokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Locale;
import java.util.Optional;

/**
 * "I forgot my password", for customers.
 *
 * A six-digit code is e-mailed, verified, and exchanged for a new password. The code lives in
 * Redis as a hash with a fifteen-minute life, never in the database and never in a log.
 *
 * <p><strong>Customers only.</strong> Staff are excluded on purpose: a back-office password is
 * reissued by an administrator from the Staff screen, which keeps an audit trail and a human in
 * the loop. Letting anyone who reaches the storefront trigger a code to an admin's mailbox would
 * hand an attacker a way to spray reset e-mails at the accounts that matter most.
 *
 * <p><strong>Nothing here reveals whether an account exists.</strong> Every request answers the
 * same way whether the address is a customer, a staff member, or unknown - otherwise the form
 * becomes a way to enumerate the shop's client list.
 */
@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    /** Long enough to fetch an e-mail, short enough that a leaked code is stale by the time it travels. */
    private static final Duration CODE_TTL = Duration.ofMinutes(15);
    /** Guessing budget for a six-digit code. Five tries in fifteen minutes is not a search. */
    private static final int MAX_ATTEMPTS = 5;
    private static final int MAX_REQUESTS_PER_EMAIL = 3;
    private static final Duration REQUEST_WINDOW = Duration.ofMinutes(15);
    private static final int MAX_REQUESTS_PER_IP = 15;

    private final StringRedisTemplate redis;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final StaffPasswordService passwordService;
    private final RefreshTokenService refreshTokenService;
    private final RateLimitService rateLimiter;
    private final AuditService auditService;
    private final Mailer mailer;

    public PasswordResetService(StringRedisTemplate redis, PasswordEncoder passwordEncoder,
                                UserRepository userRepository,
                                StaffPasswordService passwordService,
                                RefreshTokenService refreshTokenService,
                                RateLimitService rateLimiter, AuditService auditService,
                                Mailer mailer) {
        this.redis = redis;
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.passwordService = passwordService;
        this.refreshTokenService = refreshTokenService;
        this.rateLimiter = rateLimiter;
        this.auditService = auditService;
        this.mailer = mailer;
    }

    /**
     * Send a reset code, if the address belongs to a customer.
     *
     * Returns nothing either way. The caller answers the same sentence to everyone.
     */
    @Transactional(readOnly = true)
    public void requestCode(String rawEmail, String ip) {
        String email = normalise(rawEmail);
        guard("rl:pwreset:ip:" + ip, MAX_REQUESTS_PER_IP);
        guard("rl:pwreset:email:" + email, MAX_REQUESTS_PER_EMAIL);

        Optional<User> candidate = userRepository.findByEmailIgnoreCase(email)
                .filter(u -> u.getRole() == Role.CLIENT)
                .filter(u -> u.getStatus() != UserStatus.DELETED);

        if (candidate.isEmpty()) {
            // Deliberately silent. Logged so an operator can still see the attempt.
            log.info("Password reset requested for an address with no eligible account.");
            return;
        }

        String code = sixDigits();
        redis.opsForValue().set(codeKey(email), passwordEncoder.encode(code), CODE_TTL);
        redis.delete(attemptsKey(email));

        User user = candidate.get();
        String shop = user.getBusinessName() != null ? user.getBusinessName() : user.getFullName();
        String plain = """
                Bonjour %s,

                Votre code de reinitialisation est : %s

                Il est valable 15 minutes. Si vous n'avez rien demande, ignorez cet e-mail :
                votre mot de passe reste inchange.
                """.formatted(shop, code);
        mailer.sendAsync(user.getEmail(), "Votre code de réinitialisation Grossimarché",
                plain, EmailTemplates.passwordResetEmail(shop, code));
    }

    /**
     * Check a code without spending it.
     *
     * Exists so the storefront can say "wrong code" before asking someone to invent a password,
     * rather than making them type one and then throwing it away. Wrong tries still count: a
     * check that costs nothing is a free guessing machine.
     */
    public void verifyCode(String rawEmail, String code) {
        requireValidCode(normalise(rawEmail), code);
    }

    /** Verify the code one last time, set the new password, and end every existing session. */
    @Transactional
    public void reset(String rawEmail, String code, String newPassword) {
        String email = normalise(rawEmail);
        requireValidCode(email, code);
        passwordService.validateStrength(newPassword);

        User user = userRepository.findByEmailIgnoreCase(email)
                .filter(u -> u.getRole() == Role.CLIENT)
                .filter(u -> u.getStatus() != UserStatus.DELETED)
                .orElseThrow(() -> new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Code invalide ou expiré."));

        passwordService.assign(user, newPassword, false);
        userRepository.save(user);

        // Spent, so the same code cannot set a second password.
        redis.delete(codeKey(email));
        redis.delete(attemptsKey(email));

        // Whoever prompted this reset may be holding a stolen session. Ending them all is the
        // point of resetting a password; leaving them alive makes it decorative.
        refreshTokenService.revokeAllForUser(user.getId());

        auditService.record(user.getId(), "PASSWORD_RESET", "User", user.getId().toString(),
                null, null, "Réinitialisé par code e-mail");
    }

    /**
     * Match the presented code against the stored hash, counting failures.
     *
     * One message for every failure - unknown address, expired code, wrong digits - so the
     * endpoint cannot be used to learn which of the three it was.
     */
    private void requireValidCode(String email, String code) {
        String stored = redis.opsForValue().get(codeKey(email));
        if (stored == null || code == null || code.isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Code invalide ou expiré.");
        }

        Long attempts = redis.opsForValue().increment(attemptsKey(email));
        if (attempts != null && attempts == 1L) {
            redis.expire(attemptsKey(email), CODE_TTL);
        }
        if (attempts != null && attempts > MAX_ATTEMPTS) {
            // Burn the code rather than merely refusing: at this point it is being guessed at.
            redis.delete(codeKey(email));
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Trop de tentatives. Demandez un nouveau code.");
        }
        if (!passwordEncoder.matches(code.trim(), stored)) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Code invalide ou expiré.");
        }
    }

    private void guard(String key, int limit) {
        RateLimitService.Result result = rateLimiter.hit(key, limit, REQUEST_WINDOW);
        if (!result.allowed()) {
            throw new RateLimitExceededException(result.retryAfterSeconds(),
                    "Trop de demandes. Réessayez plus tard.");
        }
    }

    /** Zero-padded, so "004321" is as likely as any other value. */
    private String sixDigits() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    private String normalise(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String codeKey(String email) {
        return "pwreset:code:" + email;
    }

    private String attemptsKey(String email) {
        return "pwreset:tries:" + email;
    }
}
