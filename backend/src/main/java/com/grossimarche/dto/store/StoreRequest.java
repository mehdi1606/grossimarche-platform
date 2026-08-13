package com.grossimarche.dto.store;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;

/** Admin: create or update a store. */
public record StoreRequest(
        @NotBlank @Size(max = 150) String name,
        @NotBlank @Size(max = 100) String city,
        @NotBlank @Size(max = 255) String address,
        @Size(max = 20) String phone,
        Map<String, String> openingHours,
        @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") Double lat,
        @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") Double lng,
        boolean active
) {
}
