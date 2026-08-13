package com.grossimarche.dto.mapper;

import com.grossimarche.dto.attribute.AttributeResponse;
import com.grossimarche.dto.attribute.AttributeValueResponse;
import com.grossimarche.entity.Attribute;
import org.springframework.stereotype.Component;

/** Attribute (with values) entity → DTO. */
@Component
public class AttributeMapper {

    public AttributeResponse toResponse(Attribute a) {
        return new AttributeResponse(a.getId(), a.getName(), a.getType(), a.isEnabled(),
                a.getValues().stream()
                        .map(v -> new AttributeValueResponse(v.getId(), v.getName(), v.isEnabled(),
                                v.getDisplayOrder()))
                        .toList());
    }
}
