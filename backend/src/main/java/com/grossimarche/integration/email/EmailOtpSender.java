package com.grossimarche.integration.email;

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
 * Live email sender. Posts to a configured HTTP provider (no vendor SDK) and is made
 * resilient with Resilience4j. Active only when {@code grossimarche.otp.provider=live}.
 */
@Component
@ConditionalOnProperty(prefix = "grossimarche.otp", name = "provider", havingValue = "live")
public class EmailOtpSender implements OtpSender {

    private static final Logger log = LoggerFactory.getLogger(EmailOtpSender.class);

    private final RestClient client;
    private final String from;
    private final String fromName;

    public EmailOtpSender(OtpProperties props) {
        OtpProperties.Email email = props.email();
        if (email == null || email.baseUrl() == null || email.apiKey() == null) {
            throw new IllegalStateException("grossimarche.otp.email.{baseUrl,apiKey} are required "
                    + "when otp.provider=live");
        }
        this.from = email.from();
        this.fromName = email.fromName();
        this.client = RestClient.builder()
                .baseUrl(email.baseUrl())
                .defaultHeader("Authorization", "Bearer " + email.apiKey())
                .build();
    }

    @Override
    @Retry(name = "otp-email")
    @CircuitBreaker(name = "otp-email", fallbackMethod = "fallback")
    public void send(String destination, String code) {
        client.post()
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "from", from,
                        "fromName", fromName,
                        "to", destination,
                        "subject", "Votre code Grossimarché",
                        "text", "Votre code de connexion est : " + code))
                .retrieve()
                .toBodilessEntity();
    }

    @SuppressWarnings("unused")
    private void fallback(String destination, String code, Throwable t) {
        log.error("Email OTP delivery failed for a masked destination", t);
        throw new BusinessException(ErrorCode.INTERNAL_ERROR,
                "Échec de l'envoi du code par e-mail. Veuillez réessayer.");
    }

    @Override
    public OtpChannel channel() {
        return OtpChannel.EMAIL;
    }
}
