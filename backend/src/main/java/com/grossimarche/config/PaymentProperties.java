package com.grossimarche.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Payment settings. {@code provider} selects the gateway ({@code mock} for local/test,
 * {@code cmi} for production). Real CMI credentials come from env only; none are committed.
 */
@ConfigurationProperties(prefix = "grossimarche.payment")
public record PaymentProperties(
        @DefaultValue("mock") String provider,
        String merchantId,
        String storeKey,
        @DefaultValue("dev-callback-secret") String callbackSecret,
        @DefaultValue("https://testpayment.cmi.co.ma/fim/est3Dgate") String gatewayUrl,
        @DefaultValue("http://localhost:8080/api/v1/payments/cmi/callback") String callbackUrl
) {
}
