package com.grossimarche.dto.auth;

import com.grossimarche.entity.enums.OtpChannel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/** Verify a 6-digit code for a channel/destination. */
public record OtpVerifyRequest(
        @NotNull OtpChannel channel,
        @NotBlank String destination,
        @Pattern(regexp = "\\d{6}", message = "Code à 6 chiffres requis") String code
) {
}
