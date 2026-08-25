package com.grossimarche.service;

import com.grossimarche.dto.auth.OtpRequestResponse;
import com.grossimarche.dto.auth.TokenResponse;
import com.grossimarche.dto.user.UserResponse;
import com.grossimarche.entity.LoyaltyAccount;
import com.grossimarche.entity.User;
import com.grossimarche.entity.enums.LoyaltyTier;
import com.grossimarche.entity.enums.OtpChannel;
import com.grossimarche.entity.enums.Role;
import com.grossimarche.entity.enums.UserStatus;
import com.grossimarche.exception.BusinessException;
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

    /** Roles allowed to sign in with a password. Customers are OTP-only, by design. */
    private static final List<Role> STAFF_ROLES = List.of(Role.ADMIN, Role.STORE_MANAGER);

    // Brute-force guard on the password endpoint, counted per e-mail *and* per IP so neither
    // spraying one account nor rotating accounts from one host gets a free pass.
    private static final int LOGIN_ATTEMPTS = 8;
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

        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Ce compte est bloqué.");
        }
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);
        auditService.recordLogin(user.getId(), ip, userAgent);

        return issueTokens(user);
    }

    /**
     * Back-office sign-in with e-mail + password.
     *
     * Only ADMIN / STORE_MANAGER accounts can authenticate this way. Every failure - unknown
     * e-mail, customer account, no password set, wrong password - returns the *same* message,
     * so the endpoint cannot be used to discover which addresses have back-office accounts.
     */
    @Transactional
    public TokenResponse loginWithPassword(String email, String password, String ip,
                                           String userAgent) {
        String normalised = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        guardLoginAttempts(normalised, ip);

        User user = userRepository.findByEmailIgnoreCase(normalised).orElse(null);
        if (user == null || !STAFF_ROLES.contains(user.getRole())
                || !staffPasswordService.matches(password, user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID,
                    "E-mail ou mot de passe incorrect.");
        }
        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Ce compte est bloqué.");
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);
        auditService.recordLogin(user.getId(), ip, userAgent);
        return issueTokens(user);
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
        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Ce compte est bloqué.");
        }
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
        return new UserResponse(user.getId(), user.getFullName(), user.getPhone(),
                user.getEmail(), user.getRole(), user.isMustChangePassword());
    }
}
