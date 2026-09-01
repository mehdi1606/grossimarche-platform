package com.grossimarche.service;

import com.grossimarche.dto.auth.OtpRequestResponse;
import com.grossimarche.dto.auth.TokenResponse;
import com.grossimarche.dto.user.UserResponse;
import com.grossimarche.entity.ClientType;
import com.grossimarche.entity.LoyaltyAccount;
import com.grossimarche.entity.User;
import com.grossimarche.entity.enums.LoyaltyTier;
import com.grossimarche.entity.enums.OtpChannel;
import com.grossimarche.entity.enums.Role;
import com.grossimarche.entity.enums.UserStatus;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ConflictException;
import com.grossimarche.exception.ErrorCode;
import com.grossimarche.exception.RateLimitExceededException;
import com.grossimarche.repository.LoyaltyAccountRepository;
import com.grossimarche.repository.UserRepository;
import com.grossimarche.security.JwtService;
import com.grossimarche.security.RefreshTokenService;
import com.grossimarche.security.TokenDenylistService;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;

/**
 * Ties authentication to accounts and tokens. On first successful OTP login a CLIENT account
 * and a BRONZE loyalty account are created and consent is recorded; on every login a token
 * pair is issued. Also handles back-office password sign-in, refresh-rotation and logout.
 */
@Service
public class AuthService {

    private static final String CONSENT_VERSION = "1.0";

    // Brute-force guard on the password endpoint, counted per e-mail *and* per IP so neither
    // spraying one account nor rotating accounts from one host gets a free pass.
    private static final int LOGIN_ATTEMPTS = 8;
    /** Sign-ups are cheap to submit and expensive to moderate. */
    private static final int REGISTRATIONS_PER_HOUR = 5;
    private static final Duration LOGIN_WINDOW = Duration.ofMinutes(15);

    private final OtpService otpService;
    private final UserRepository userRepository;
    private final LoyaltyAccountRepository loyaltyAccountRepository;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final TokenDenylistService denylistService;
    private final AuditService auditService;
    private final StaffPasswordService staffPasswordService;
    private final RateLimitService rateLimiter;

    public AuthService(OtpService otpService, UserRepository userRepository,
                       LoyaltyAccountRepository loyaltyAccountRepository, JwtService jwtService,
                       RefreshTokenService refreshTokenService, TokenDenylistService denylistService,
                       AuditService auditService, StaffPasswordService staffPasswordService,
                       RateLimitService rateLimiter) {
        this.otpService = otpService;
        this.userRepository = userRepository;
        this.loyaltyAccountRepository = loyaltyAccountRepository;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.denylistService = denylistService;
        this.auditService = auditService;
        this.staffPasswordService = staffPasswordService;
        this.rateLimiter = rateLimiter;
    }

    public OtpRequestResponse requestOtp(OtpChannel channel, String destination, String ip) {
        return otpService.request(channel, destination, ip);
    }

    /** Verify a code, create the account on first login, and issue a token pair. */
    @Transactional
    public TokenResponse verifyAndAuthenticate(OtpChannel channel, String destination, String code,
                                               String ip, String userAgent) {
        OtpService.VerifiedOtp verified = otpService.verify(channel, destination, code);
        User user = findOrCreate(verified.channel(), verified.destination(), ip, userAgent);

        // The same state check as password sign-in, and not optional: without it a customer
        // could register, land in PENDING, then request an OTP on the very phone number they
        // just gave and walk straight past the validation they are waiting for.
        assertCanSignIn(user);
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);
        auditService.recordLogin(user.getId(), ip, userAgent);

        return issueTokens(user);
    }

    /**
     * Sign in with e-mail + password - back-office and storefront alike.
     *
     * Every credential failure - unknown e-mail, no password set, wrong password - returns the
     * *same* message, so the endpoint cannot be used to discover which addresses have accounts.
     *
     * Account *state* is deliberately not hidden that way. A customer waiting for validation has
     * to be told they are waiting, or they will retype a correct password until they give up and
     * telephone. Saying so leaks nothing a successful sign-up did not already reveal to the
     * person who performed it.
     */
    @Transactional
    public TokenResponse loginWithPassword(String email, String password, String ip,
                                           String userAgent) {
        String normalised = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        guardLoginAttempts(normalised, ip);

        User user = userRepository.findByEmailIgnoreCase(normalised).orElse(null);
        if (user == null || !staffPasswordService.matches(password, user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID,
                    "E-mail ou mot de passe incorrect.");
        }
        assertCanSignIn(user);

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);
        auditService.recordLogin(user.getId(), ip, userAgent);
        return issueTokens(user);
    }

    /**
     * Register a shop and leave it waiting for validation.
     *
     * The account is created with a working password and no access: wholesale prices are per
     * segment and confidential, so a form submission must not be enough to read the grid. An
     * admin recognises the business first.
     *
     * An e-mail already in use is refused rather than adopted. Silently attaching a sign-up to
     * an existing row would hand whoever typed the address that account's history.
     */
    @Transactional
    public UserResponse register(String fullName, String businessName, String email, String phone,
                                 String city, ClientType clientType, String password, String ip) {
        String normalisedEmail = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        String normalisedPhone = phone == null ? null : phone.trim();

        guardRegistrationRate(ip);
        staffPasswordService.validateStrength(password);

        if (userRepository.findByEmailIgnoreCase(normalisedEmail).isPresent()) {
            throw new ConflictException("Un compte existe déjà avec cette adresse e-mail.");
        }
        if (normalisedPhone != null && userRepository.findByPhone(normalisedPhone).isPresent()) {
            throw new ConflictException("Un compte existe déjà avec ce numéro de téléphone.");
        }
        if (!clientType.isActive()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Ce type de client n'est plus proposé.");
        }

        User user = User.builder()
                .fullName(fullName.trim())
                .businessName(businessName.trim())
                .email(normalisedEmail)
                .phone(normalisedPhone)
                .city(city == null || city.isBlank() ? null : city.trim())
                .clientType(clientType)
                .role(Role.CLIENT)
                .status(UserStatus.PENDING)
                .consentAt(Instant.now())
                .consentVersion(CONSENT_VERSION)
                .build();
        // Their own password, chosen by them: unlike a staff invitation there is nothing to
        // change at first sign-in.
        staffPasswordService.assign(user, password, false);
        user = userRepository.save(user);

        auditService.record(user.getId(), "CUSTOMER_REGISTERED", "User", user.getId().toString(),
                null, null, "En attente de validation");
        return UserResponse.from(user);
    }

    /**
     * Whether this account may exchange credentials for tokens, with a message that says why
     * when it may not.
     */
    private void assertCanSignIn(User user) {
        switch (user.getStatus()) {
            case ACTIVE -> {
                // fall through to sign-in
            }
            case PENDING -> throw new BusinessException(ErrorCode.FORBIDDEN,
                    "Votre compte est en attente de validation. Vous recevrez un e-mail dès "
                            + "qu'il sera activé.");
            case REJECTED -> throw new BusinessException(ErrorCode.FORBIDDEN,
                    "Votre demande de compte n'a pas été acceptée. Contactez-nous pour en "
                            + "savoir plus.");
            case BLOCKED -> throw new BusinessException(ErrorCode.FORBIDDEN, "Ce compte est bloqué.");
            case DELETED -> throw new BusinessException(ErrorCode.TOKEN_INVALID,
                    "E-mail ou mot de passe incorrect.");
        }
    }

    /**
     * Sign-ups are cheap to submit and expensive to moderate, so one host cannot flood the
     * validation queue.
     */
    private void guardRegistrationRate(String ip) {
        RateLimitService.Result result = rateLimiter.hit(
                "rl:register:ip:" + ip, REGISTRATIONS_PER_HOUR, Duration.ofHours(1));
        if (!result.allowed()) {
            throw new RateLimitExceededException(result.retryAfterSeconds(),
                    "Trop de demandes d'inscription. Réessayez plus tard.");
        }
    }

    private void guardLoginAttempts(String email, String ip) {
        RateLimitService.Result byEmail = rateLimiter.hit(
                "rl:login:email:" + email, LOGIN_ATTEMPTS, LOGIN_WINDOW);
        RateLimitService.Result byIp = rateLimiter.hit(
                "rl:login:ip:" + ip, LOGIN_ATTEMPTS * 3, LOGIN_WINDOW);
        if (!byEmail.allowed() || !byIp.allowed()) {
            throw new RateLimitExceededException(
                    Math.max(byEmail.retryAfterSeconds(), byIp.retryAfterSeconds()),
                    "Trop de tentatives de connexion. Réessayez plus tard.");
        }
    }

    /** Rotate a refresh token and issue a fresh access token. */
    public TokenResponse refresh(String refreshToken) {
        RefreshTokenService.RotatedRefreshToken rotated = refreshTokenService.rotate(refreshToken);
        User user = userRepository.findById(rotated.userId())
                .orElseThrow(() -> new BusinessException(ErrorCode.TOKEN_INVALID, "Compte introuvable."));
        // Re-checked on every rotation, not just at sign-in: a session that was live when the
        // account was rejected or blocked must not be able to renew itself indefinitely.
        assertCanSignIn(user);
        JwtService.IssuedAccessToken access = jwtService.issue(user.getId(), user.getRole());
        return new TokenResponse(access.value(), access.expiresInSeconds(), rotated.token(),
                toUserResponse(user));
    }

    /** Revoke the refresh token's family and denylist the current access token. */
    public void logout(String accessToken, String refreshToken) {
        if (refreshToken != null) {
            refreshTokenService.revoke(refreshToken);
        }
        if (accessToken != null) {
            try {
                Jwt jwt = jwtService.parse(accessToken);
                if (jwt.getId() != null && jwt.getExpiresAt() != null) {
                    denylistService.denylist(jwt.getId(), jwt.getExpiresAt());
                }
            } catch (JwtException ignored) {
                // Already-invalid access token: nothing to denylist.
            }
        }
    }

    private User findOrCreate(OtpChannel channel, String destination, String ip, String userAgent) {
        return (channel == OtpChannel.SMS
                ? userRepository.findByPhone(destination)
                : userRepository.findByEmail(destination))
                .orElseGet(() -> createUser(channel, destination, ip, userAgent));
    }

    private User createUser(OtpChannel channel, String destination, String ip, String userAgent) {
        User user = User.builder()
                .role(Role.CLIENT)
                .status(UserStatus.ACTIVE)
                .phone(channel == OtpChannel.SMS ? destination : null)
                .email(channel == OtpChannel.EMAIL ? destination : null)
                .phoneVerified(channel == OtpChannel.SMS)
                .emailVerified(channel == OtpChannel.EMAIL)
                .consentAt(Instant.now())
                .consentVersion(CONSENT_VERSION)
                .build();
        user = userRepository.save(user);

        loyaltyAccountRepository.save(LoyaltyAccount.builder()
                .userId(user.getId())
                .pointsBalance(0)
                .lifetimePoints(0)
                .tier(LoyaltyTier.BRONZE)
                .build());

        auditService.recordUserCreated(user.getId(), ip, userAgent);
        return user;
    }

    private TokenResponse issueTokens(User user) {
        JwtService.IssuedAccessToken access = jwtService.issue(user.getId(), user.getRole());
        RefreshTokenService.IssuedRefreshToken refresh = refreshTokenService.issue(user.getId());
        return new TokenResponse(access.value(), access.expiresInSeconds(), refresh.token(),
                toUserResponse(user));
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.from(user);
    }
}
