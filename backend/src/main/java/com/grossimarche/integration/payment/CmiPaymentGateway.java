package com.grossimarche.integration.payment;

import com.grossimarche.config.PaymentProperties;
import com.grossimarche.dto.order.CmiRedirectResponse;
import com.grossimarche.entity.Order;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.TreeMap;

/**
 * Production CMI gateway. Builds the 3-D Secure redirect form and verifies callbacks using
 * CMI's store-key SHA-512 hashing scheme. Active only when
 * {@code grossimarche.payment.provider=cmi}; credentials come from env. No card data is
 * ever received or stored here — PCI scope stays with CMI.
 */
@Component
@ConditionalOnProperty(prefix = "grossimarche.payment", name = "provider", havingValue = "cmi")
public class CmiPaymentGateway implements PaymentGateway {

    private final PaymentProperties props;

    public CmiPaymentGateway(PaymentProperties props) {
        if (props.merchantId() == null || props.storeKey() == null) {
            throw new IllegalStateException("grossimarche.payment.{merchantId,storeKey} are required "
                    + "when payment.provider=cmi");
        }
        this.props = props;
    }

    @Override
    public String provider() {
        return "cmi";
    }

    @Override
    public CmiRedirectResponse createRedirect(Order order) {
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("clientid", props.merchantId());
        fields.put("oid", order.getOrderNumber());
        fields.put("amount", order.getTotal().toPlainString());
        fields.put("currency", "504");
        fields.put("okUrl", props.callbackUrl());
        fields.put("failUrl", props.callbackUrl());
        fields.put("rnd", Long.toHexString(System.nanoTime()));
        fields.put("hash", hash(fields));
        return new CmiRedirectResponse(props.gatewayUrl(), fields);
    }

    @Override
    public CallbackResult handleCallback(Map<String, String> params) {
        String provided = params.get("HASH");
        Map<String, String> signable = new LinkedHashMap<>(params);
        signable.remove("HASH");
        signable.remove("hash");
        boolean verified = provided != null && provided.equals(hash(signable));
        boolean success = "Approved".equalsIgnoreCase(params.get("ProcReturnCode"))
                || "00".equals(params.get("ProcReturnCode"));
        return new CallbackResult(verified, params.getOrDefault("oid", params.get("orderNumber")),
                verified && success);
    }

    /** CMI hash: SHA-512 over the store-key-salted, sorted parameter values, Base64-encoded. */
    private String hash(Map<String, String> params) {
        StringBuilder sb = new StringBuilder();
        new TreeMap<>(params).forEach((k, v) -> sb.append(v == null ? "" : v).append('|'));
        sb.append(props.storeKey());
        try {
            byte[] digest = MessageDigest.getInstance("SHA-512")
                    .digest(sb.toString().getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(digest);
        } catch (Exception e) {
            throw new IllegalStateException("CMI hash computation failed", e);
        }
    }
}
