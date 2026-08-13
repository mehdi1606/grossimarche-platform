package com.grossimarche.integration.email;

import com.grossimarche.entity.enums.OtpChannel;
import com.grossimarche.integration.OtpSender;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Local/test email sender: writes the code to the log at DEBUG only. Active when
 * {@code grossimarche.otp.provider=logging} (the default).
 */
@Component
@ConditionalOnProperty(prefix = "grossimarche.otp", name = "provider", havingValue = "logging",
        matchIfMissing = true)
public class LoggingEmailOtpSender implements OtpSender {

    private static final Logger log = LoggerFactory.getLogger(LoggingEmailOtpSender.class);

    @Override
    public void send(String destination, String code) {
        log.debug("[DEV OTP][EMAIL] destination={} code={}", destination, code);
    }

    @Override
    public OtpChannel channel() {
        return OtpChannel.EMAIL;
    }
}
