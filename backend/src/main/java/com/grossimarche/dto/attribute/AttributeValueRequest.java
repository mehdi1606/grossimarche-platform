package com.grossimarche.dto.attribute;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** One allowed value of an attribute (as submitted by the admin). */
public record AttributeValueRequest(
        @NotBlank @Size(max = 120) String name,
        boolean enabled
) {
}
