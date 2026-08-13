package com.grossimarche.dto.auth;

import com.grossimarche.entity.enums.OtpChannel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request a one-time code. {@code destination} is a Moroccan phone (for SMS) or an email
 * (for EMAIL); the channel-specific format is validated in the service (B4).
 */
public record OtpRequestRequest(
        @NotNull OtpChannel channel,
        @NotBlank String destination
) {
}
