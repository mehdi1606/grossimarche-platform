package com.grossimarche.dto.order;

import java.util.Map;

/**
 * CMI redirect payload returned for CARD checkouts: the gateway URL and the signed form
 * fields the client must POST to it. Never contains card data.
 */
public record CmiRedirectResponse(
        String redirectUrl,
        Map<String, String> formFields
) {
}
