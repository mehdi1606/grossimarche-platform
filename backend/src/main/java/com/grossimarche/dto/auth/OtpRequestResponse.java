package com.grossimarche.dto.auth;

import com.grossimarche.entity.enums.OtpChannel;

/** Confirms a code was sent. The code itself is NEVER returned, in any profile. */
public record OtpRequestResponse(
        OtpChannel channel,
        String maskedDestination,
        int expiresInSeconds
) {
}
