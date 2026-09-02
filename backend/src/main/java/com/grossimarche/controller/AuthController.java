package com.grossimarche.controller;

import com.grossimarche.dto.auth.LogoutRequest;
import com.grossimarche.dto.auth.OtpRequestRequest;
import com.grossimarche.dto.auth.PasswordLoginRequest;
import com.grossimarche.dto.auth.PasswordResetRequests;
import com.grossimarche.dto.auth.OtpRequestResponse;
import com.grossimarche.dto.auth.OtpVerifyRequest;
import com.grossimarche.dto.auth.RefreshRequest;
import com.grossimarche.dto.auth.RegisterRequest;
import com.grossimarche.dto.auth.TokenResponse;
import com.grossimarche.dto.user.UserResponse;
import com.grossimarche.service.CustomerRegistrationService;
import com.grossimarche.service.AuthService;
import com.grossimarche.service.PasswordResetService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Authentication endpoints. Thin: validate, resolve the caller's IP/UA, and delegate to
 * {@link AuthService}. No business logic here.
 *
 * {@code /login} serves everyone now: staff and customers alike sign in with e-mail and
 * password. {@code /register} opens a customer account, which stays PENDING until an admin
 * validates it - so registering grants no access and, in particular, no sight of any price.
 *
 * The OTP pair ({@code /otp/request}, {@code /otp/verify}) is still wired up but the
 * storefront no longer uses it.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final String BEARER_PREFIX = "Bearer ";

    private final AuthService authService;
    private final CustomerRegistrationService registrationService;
    private final PasswordResetService passwordResetService;

    public AuthController(AuthService authService,
                          CustomerRegistrationService registrationService,
                          PasswordResetService passwordResetService) {
        this.authService = authService;
        this.registrationService = registrationService;
        this.passwordResetService = passwordResetService;
    }

    /**
     * Step 1 of a forgotten password: e-mail a code.
     *
     * Answers the same sentence whether the address belongs to a customer, to a staff member,
     * or to nobody. "No such account" would make this form a way to enumerate the shop's client
     * list, and "that is a staff account" would be worse.
     */
    @PostMapping("/password/forgot")
    public Map<String, String> forgotPassword(
            @Valid @RequestBody PasswordResetRequests.Forgot body, HttpServletRequest request) {
        passwordResetService.requestCode(body.email(), clientIp(request));
        return Map.of("message",
                "Si un compte client existe avec cette adresse, un code vient d'être envoyé.");
    }

    /** Step 2: check the code before asking the shopper to invent a password. */
    @PostMapping("/password/verify-code")
    public Map<String, String> verifyResetCode(
            @Valid @RequestBody PasswordResetRequests.VerifyCode body) {
        passwordResetService.verifyCode(body.email(), body.code());
        return Map.of("message", "Code vérifié.");
    }

    /** Step 3: spend the code, set the password, and end every existing session. */
    @PostMapping("/password/reset")
    public Map<String, String> resetPassword(
            @Valid @RequestBody PasswordResetRequests.Reset body) {
        passwordResetService.reset(body.email(), body.code(), body.newPassword());
        return Map.of("message", "Mot de passe mis à jour. Vous pouvez vous connecter.");
    }

    /**
     * Apply for a trade account.
     *
     * Returns the created account, always PENDING. There are no tokens in the response:
     * registering is a request, not a sign-in.
     */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest body,
                                 HttpServletRequest request) {
        return registrationService.register(body, clientIp(request));
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
