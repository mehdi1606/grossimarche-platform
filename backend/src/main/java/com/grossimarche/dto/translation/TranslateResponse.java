package com.grossimarche.dto.translation;

import java.util.List;

/** Translated strings, in the same order as the request. */
public record TranslateResponse(List<String> translatedText) {
}
