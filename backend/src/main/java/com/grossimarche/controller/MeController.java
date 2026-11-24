package com.grossimarche.controller;

import com.grossimarche.dto.auth.ChangePasswordRequest;
import com.grossimarche.dto.auth.OtpRequestRequest;
import com.grossimarche.dto.auth.OtpRequestResponse;
import com.grossimarche.dto.auth.OtpVerifyRequest;
import com.grossimarche.dto.device.DeviceRegistrationRequest;
import com.grossimarche.dto.user.UpdateProfileRequest;
import com.grossimarche.dto.user.UserResponse;
import com.grossimarche.security.SecurityUtils;
import com.grossimarche.service.DeviceService;
import com.grossimarche.service.ProfileService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Current-user profile, contact change (fresh OTP) and loi 09-08 data rights. */
@RestController
@RequestMapping("/api/v1/me")
public class MeController {

    private final ProfileService profileService;
    private final DeviceService deviceService;

    public MeController(ProfileService profileService, DeviceService deviceService) {
        this.profileService = profileService;
        this.deviceService = deviceService;
    }

    /**
     * Register this device for push notifications.
     *
     * Called by the mobile app at every start, not only at first sign-in: a Firebase token
     * rotates on its own after a reinstall or a restored backup, and a device that stops
     * re-registering simply stops being told anything.
     */
    @PostMapping("/devices")
    public ResponseEntity<Void> registerDevice(@Valid @RequestBody DeviceRegistrationRequest body) {
        deviceService.register(SecurityUtils.currentUserId(), body);
        return ResponseEntity.noContent().build();
    }

    /** Forget this device at sign-out, so a shared phone stops ringing for the last account. */
    @DeleteMapping("/devices")
    public ResponseEntity<Void> forgetDevice(@Valid @RequestBody DeviceRegistrationRequest body) {
        deviceService.forget(body.token());
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public UserResponse me() {
        return profileService.getMe(SecurityUtils.currentUserId());
    }

    @PatchMapping
    public UserResponse update(@Valid @RequestBody UpdateProfileRequest body) {
        return profileService.updateProfile(SecurityUtils.currentUserId(), body);
    }

    @DeleteMapping
    public ResponseEntity<Void> delete() {
        profileService.deleteMe(SecurityUtils.currentUserId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/export")
    public Map<String, Object> export() {
        return profileService.exportMe(SecurityUtils.currentUserId());
    }

    /** Change one's own password (customers and staff alike). */
    @PostMapping("/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest body) {
        profileService.changePassword(SecurityUtils.currentUserId(), body.currentPassword(),
                body.newPassword());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/contact/request")
    public OtpRequestResponse requestContactChange(@Valid @RequestBody OtpRequestRequest body,
                                                   HttpServletRequest request) {
        return profileService.requestContactChange(SecurityUtils.currentUserId(), body.channel(),
                body.destination(), clientIp(request));
    }

    @PostMapping("/contact/verify")
    public UserResponse confirmContactChange(@Valid @RequestBody OtpVerifyRequest body) {
        return profileService.confirmContactChange(SecurityUtils.currentUserId(), body.channel(),
                body.destination(), body.code());
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return StringUtils.hasText(forwarded) ? forwarded.split(",")[0].trim() : request.getRemoteAddr();
    }
}
