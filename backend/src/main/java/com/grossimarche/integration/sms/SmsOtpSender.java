package com.grossimarche.integration.sms;

import com.grossimarche.config.OtpProperties;
import com.grossimarche.entity.enums.OtpChannel;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ErrorCode;
import com.grossimarche.integration.OtpSender;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Live SMS sender. Posts to a configured HTTP provider (no vendor SDK imported) and is made
 * resilient with Resilience4j (retry + circuit breaker with a fallback). Active only when
 * {@code grossimarche.otp.provider=live}; real credentials come from env.
 */
@Component
@ConditionalOnProperty(prefix = "grossimarche.otp", name = "provider", havingValue = "live")
public class SmsOtpSender implements OtpSender {

    private static final Logger log = LoggerFactory.getLogger(SmsOtpSender.class);

    private final RestClient client;
    private final String senderId;

    public SmsOtpSender(OtpProperties props) {
        OtpProperties.Sms sms = props.sms();
        if (sms == null || sms.baseUrl() == null || sms.apiKey() == null) {
            throw new IllegalStateException("grossimarche.otp.sms.{baseUrl,apiKey} are required "
                    + "when otp.provider=live");
        }
        this.senderId = sms.senderId();
        this.client = RestClient.builder()
                .baseUrl(sms.baseUrl())
                .defaultHeader("Authorization", "Bearer " + sms.apiKey())
                .build();
    }

    @Override
    @Retry(name = "otp-sms")
    @CircuitBreaker(name = "otp-sms", fallbackMethod = "fallback")
    public void send(String destination, String code) {
        client.post()
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("to", destination, "from", senderId,
                        "text", "Grossimarché: votre code est " + code))
                .retrieve()
                .toBodilessEntity();
    }

    @SuppressWarnings("unused")
    private void fallback(String destination, String code, Throwable t) {
        log.error("SMS OTP delivery failed for a masked destination", t);
        throw new BusinessException(ErrorCode.INTERNAL_ERROR,
                "Échec de l'envoi du code par SMS. Veuillez réessayer.");
    }

    @Override
    public OtpChannel channel() {
        return OtpChannel.SMS;
    }
}
