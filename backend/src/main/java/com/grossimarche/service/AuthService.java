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
import com.grossimarche.repository.LoyaltyAccountRepository;
import com.grossimarche.repository.UserRepository;
import com.grossimarche.security.JwtService;
import com.grossimarche.security.RefreshTokenService;
import com.grossimarche.security.TokenDenylistService;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Ties OTP verification to accounts and tokens. On first successful login a CLIENT account
 * and a BRONZE loyalty account are created and consent is recorded; on every login a token
 * pair is issued. Also handles refresh-rotation and logout.
 */
@Service
public class AuthService {

    private static final String CONSENT_VERSION = "1.0";

    private final OtpService otpService;
    private final UserRepository userRepository;
    private final LoyaltyAccountRepository loyaltyAccountRepository;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final TokenDenylistService denylistService;
    private final AuditService auditService;

    public AuthService(OtpService otpService, UserRepository userRepository,
                       LoyaltyAccountRepository loyaltyAccountRepository, JwtService jwtService,
                       RefreshTokenService refreshTokenService, TokenDenylistService denylistService,
                       AuditService auditService) {
        this.otpService = otpService;
        this.userRepository = userRepository;
        this.loyaltyAccountRepository = loyaltyAccountRepository;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.denylistService = denylistService;
        this.auditService = auditService;
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
                user.getEmail(), user.getRole());
    }
}
