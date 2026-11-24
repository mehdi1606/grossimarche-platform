package com.grossimarche.dto.device;

import com.grossimarche.entity.enums.DevicePlatform;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * What the app sends at sign-in so notifications can reach this phone.
 *
 * @param token    the registration token Firebase gave the app; it changes on its own, so the
 *                 app sends it again at every start rather than only once
 * @param platform which app registered it, for diagnosing a delivery problem later
 */
public record DeviceRegistrationRequest(
        @NotBlank @Size(max = 4096) String token,
        @NotNull DevicePlatform platform
) {
}
