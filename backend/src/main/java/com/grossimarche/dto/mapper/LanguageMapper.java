package com.grossimarche.dto.mapper;

import com.grossimarche.dto.language.LanguageResponse;
import com.grossimarche.entity.Language;
import org.springframework.stereotype.Component;

/** Language entity → DTO. */
@Component
public class LanguageMapper {

    public LanguageResponse toResponse(Language l) {
        return new LanguageResponse(l.getId(), l.getName(), l.getIsoCode(), l.getFlag(),
                l.isDefault(), l.isEnabled());
    }
}
