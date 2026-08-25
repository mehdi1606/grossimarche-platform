package com.grossimarche.controller;

import com.grossimarche.dto.auth.LogoutRequest;
import com.grossimarche.dto.auth.OtpRequestRequest;
import com.grossimarche.dto.auth.PasswordLoginRequest;
import com.grossimarche.dto.auth.OtpRequestResponse;
import com.grossimarche.dto.auth.OtpVerifyRequest;
import com.grossimarche.dto.auth.RefreshRequest;
import com.grossimarche.dto.auth.TokenResponse;
import com.grossimarche.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Authentication endpoints. Thin: validate, resolve the caller's IP/UA, and delegate to
 * {@link AuthService}. No business logic here.
 *
 * Two ways in, on purpose: customers use the passwordless OTP pair ({@code /otp/request} then
 * {@code /otp/verify}), and back-office staff use {@code /login} with e-mail + password. The
 * storefront never calls {@code /login}, and a customer account cannot authenticate with it.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final String BEARER_PREFIX = "Bearer ";

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** Back-office sign-in. Staff only - see {@link AuthService#loginWithPassword}. */
    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody PasswordLoginRequest body,
                               HttpServletRequest request) {
        return authService.loginWithPassword(body.email(), body.password(),
                clientIp(request), request.getHeader(HttpHeaders.USER_AGENT));
    }

    @PostMapping("/otp/request")
    public OtpRequestResponse requestOtp(@Valid @RequestBody OtpRequestRequest body,
                                         HttpServletRequest request) {
        return authService.requestOtp(body.channel(), body.destination(), clientIp(request));
    }

    @PostMapping("/otp/verify")
    public TokenResponse verifyOtp(@Valid @RequestBody OtpVerifyRequest body,
                                   HttpServletRequest request) {
        return authService.verifyAndAuthenticate(body.channel(), body.destination(), body.code(),
                clientIp(request), request.getHeader(HttpHeaders.USER_AGENT));
    }

    @PostMapping("/refresh")
    public TokenResponse refresh(@Valid @RequestBody RefreshRequest body) {
        return authService.refresh(body.refreshToken());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody LogoutRequest body,
                                       HttpServletRequest request) {
        authService.logout(bearerToken(request), body.refreshToken());
        return ResponseEntity.noContent().build();
    }

    private String bearerToken(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        return (header != null && header.startsWith(BEARER_PREFIX))
                ? header.substring(BEARER_PREFIX.length()).trim()
                : null;
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwarded)) {
            // First hop is the original client.
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
