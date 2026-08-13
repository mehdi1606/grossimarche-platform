package com.grossimarche.integration.payment;

import com.grossimarche.config.PaymentProperties;
import com.grossimarche.dto.order.CmiRedirectResponse;
import com.grossimarche.entity.Order;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.TreeMap;

/**
 * Local/test payment gateway. Produces a redirect payload signed with an HMAC and verifies
 * callbacks the same way, so the full CARD flow can be exercised without CMI credentials.
 * Active when {@code grossimarche.payment.provider=mock} (the default).
 */
@Component
@ConditionalOnProperty(prefix = "grossimarche.payment", name = "provider", havingValue = "mock",
        matchIfMissing = true)
public class MockPaymentGateway implements PaymentGateway {

    private final PaymentProperties props;

    public MockPaymentGateway(PaymentProperties props) {
        this.props = props;
    }

    @Override
    public String provider() {
        return "mock";
    }

    @Override
    public CmiRedirectResponse createRedirect(Order order) {
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("orderNumber", order.getOrderNumber());
        fields.put("amount", order.getTotal().toPlainString());
        fields.put("currency", "504"); // MAD
        fields.put("callbackUrl", props.callbackUrl());
        fields.put("signature", sign(fields));
        return new CmiRedirectResponse(props.gatewayUrl(), fields);
    }

    @Override
    public CallbackResult handleCallback(Map<String, String> params) {
        String provided = params.get("signature");
        Map<String, String> signable = new LinkedHashMap<>(params);
        signable.remove("signature");
        boolean verified = provided != null && provided.equals(sign(signable));
        boolean success = "SUCCESS".equalsIgnoreCase(params.get("status"));
        return new CallbackResult(verified, params.get("orderNumber"), verified && success);
    }

    /** HMAC-SHA256 over the params in a stable (sorted) order. */
    private String sign(Map<String, String> params) {
        StringBuilder sb = new StringBuilder();
        new TreeMap<>(params).forEach((k, v) -> sb.append(k).append('=').append(v).append('&'));
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(props.callbackSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(sb.toString().getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("HMAC computation failed", e);
        }
    }
}
