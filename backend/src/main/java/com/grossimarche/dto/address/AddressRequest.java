package com.grossimarche.dto.address;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Create or update a delivery address. */
public record AddressRequest(
        @Size(max = 60) String label,
        @NotBlank @Size(max = 100) String city,
        @NotBlank @Size(max = 255) String addressLine,
        @DecimalMin("-90.0") @DecimalMax("90.0") Double lat,
        @DecimalMin("-180.0") @DecimalMax("180.0") Double lng,
        boolean isDefault
) {
}
