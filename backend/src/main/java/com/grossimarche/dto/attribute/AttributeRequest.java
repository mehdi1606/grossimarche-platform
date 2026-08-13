package com.grossimarche.dto.attribute;

import com.grossimarche.entity.enums.AttributeType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/** Admin: create or update a catalogue attribute together with its allowed values. */
public record AttributeRequest(
        @NotBlank @Size(max = 80) String name,
        @NotNull AttributeType type,
        boolean enabled,
        @Valid List<AttributeValueRequest> values
) {
}
