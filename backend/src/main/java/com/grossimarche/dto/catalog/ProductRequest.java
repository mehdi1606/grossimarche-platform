package com.grossimarche.dto.catalog;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

/** Admin: create or update a product (price tiers are managed separately). */
public record ProductRequest(
        @NotNull UUID categoryId,
        @NotBlank @Size(max = 200) String name,
        @NotBlank @Size(max = 220) String slug,
        @Size(max = 5000) String description,
        @NotNull @DecimalMin("0.00") @Digits(integer = 10, fraction = 2) BigDecimal price,
        @NotBlank @Size(max = 40) String unit,
        @PositiveOrZero int stockQuantity,
        @Min(1) int minOrderQuantity,
        @Size(max = 500) String imageUrl,
        boolean active
) {
}
