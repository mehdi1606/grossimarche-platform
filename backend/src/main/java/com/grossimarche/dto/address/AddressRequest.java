package com.grossimarche.dto.address;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Create or update a delivery address. */
public record AddressRequest(
        @Size(max = 60) String label,
        @NotBlank @Size(max = 100) String city,
        /**
         * The district within the city, chosen from the city's list. Optional: cities
         * without districts have none. It is what selects the delivery rate when the city
         * prices its rounds district by district.
         */
        @Size(max = 120) String district,
        @NotBlank @Size(max = 255) String addressLine,
        @DecimalMin("-90.0") @DecimalMax("90.0") Double lat,
        @DecimalMin("-180.0") @DecimalMax("180.0") Double lng,
        boolean isDefault
) {
}
