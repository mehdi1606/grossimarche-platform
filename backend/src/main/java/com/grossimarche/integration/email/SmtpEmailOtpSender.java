package com.grossimarche.integration.email;

import com.grossimarche.config.OtpProperties;
import com.grossimarche.entity.enums.OtpChannel;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ErrorCode;
import com.grossimarche.integration.OtpSender;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;

/**
 * SMTP email sender (Gmail, or any SMTP relay). Connection settings come from
 * {@code spring.mail.*} and never from source — see {@code .env.example}. Active when
 * {@code grossimarche.otp.provider=smtp}, which leaves the SMS channel on the logging
 * sender. Delivery is wrapped in the same Resilience4j retry/circuit breaker as the HTTP
 * provider, so a flaky relay degrades into a clean business error.
 */
@Component
@ConditionalOnProperty(prefix = "grossimarche.otp", name = "provider", havingValue = "smtp")
public class SmtpEmailOtpSender implements OtpSender {

    private static final Logger log = LoggerFactory.getLogger(SmtpEmailOtpSender.class);

    private final JavaMailSender mailSender;
    private final String from;
    private final String fromName;

    public SmtpEmailOtpSender(JavaMailSender mailSender, OtpProperties props,
                              @Value("${spring.mail.username:}") String mailUsername) {
        OtpProperties.Email email = props.email();
        String configuredFrom = email == null ? null : email.from();
        // Gmail rewrites (or rejects) a From that is not the authenticated mailbox, so the
        // account username is the right default when MAIL_FROM is not set.
        this.from = StringUtils.hasText(configuredFrom) ? configuredFrom : mailUsername;
        this.fromName = email == null || !StringUtils.hasText(email.fromName())
                ? "Grossimarché" : email.fromName();
        if (!StringUtils.hasText(this.from)) {
            throw new IllegalStateException("MAIL_FROM or spring.mail.username is required "
                    + "when otp.provider=smtp");
        }
        if (!StringUtils.hasText(mailUsername)) {
            throw new IllegalStateException("spring.mail.username / spring.mail.password are "
                    + "required when otp.provider=smtp");
        }
        this.mailSender = mailSender;
    }

    @Override
    @Retry(name = "otp-email")
    @CircuitBreaker(name = "otp-email", fallbackMethod = "fallback")
    public void send(String destination, String code) {
        MimeMessage message = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, false,
                    StandardCharsets.UTF_8.name());
            helper.setFrom(new InternetAddress(from, fromName, StandardCharsets.UTF_8.name()));
            helper.setTo(destination);
            helper.setSubject("Votre code Grossimarché");
            helper.setText("""
                    Votre code de connexion Grossimarché est : %s

                    Ce code expire dans 5 minutes et ne peut être utilisé qu'une seule fois.
                    Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.
                    """.formatted(code));
        } catch (Exception e) {
            // Message construction failed (bad address / encoding) — surface it through the
            // same fallback as a delivery failure.
            throw new IllegalStateException("Could not build the OTP email", e);
        }
        mailSender.send(message);
    }

    @SuppressWarnings("unused")
    private void fallback(String destination, String code, Throwable t) {
        log.error("SMTP OTP delivery failed for a masked destination", t);
        throw new BusinessException(ErrorCode.INTERNAL_ERROR,
                "Échec de l'envoi du code par e-mail. Veuillez réessayer.");
    }

    @Override
    public OtpChannel channel() {
        return OtpChannel.EMAIL;
    }
}
