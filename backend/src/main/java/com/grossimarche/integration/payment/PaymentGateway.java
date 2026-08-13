package com.grossimarche.integration.payment;

import com.grossimarche.dto.order.CmiRedirectResponse;
import com.grossimarche.entity.Order;

import java.util.Map;

/**
 * Payment gateway abstraction. The application stores zero card data — the PAN/CVV never
 * touch this server; only signed redirect fields go out and a signed callback comes back.
 */
public interface PaymentGateway {

    String provider();

    /** Build the redirect payload the client posts to the gateway to pay for {@code order}. */
    CmiRedirectResponse createRedirect(Order order);

    /**
     * Verify a gateway callback's signature <em>before</em> trusting any field, then report
     * which order it concerns and whether payment succeeded.
     */
    CallbackResult handleCallback(Map<String, String> params);

    /** Outcome of a callback: whether the signature verified, the order, and the result. */
    record CallbackResult(boolean verified, String orderNumber, boolean success) {
    }
}
