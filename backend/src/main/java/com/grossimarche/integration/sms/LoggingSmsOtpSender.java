package com.grossimarche.integration.sms;

import com.grossimarche.entity.enums.OtpChannel;
import com.grossimarche.integration.OtpSender;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Local/test SMS sender: writes the code to the log at DEBUG only, so a developer can read
 * it without a real SMS account. Active when {@code grossimarche.otp.provider=logging}
 * (the default). The code must never be logged above DEBUG.
 */
@Component
@ConditionalOnProperty(prefix = "grossimarche.otp", name = "provider", havingValue = "logging",
        matchIfMissing = true)
public class LoggingSmsOtpSender implements OtpSender {

    private static final Logger log = LoggerFactory.getLogger(LoggingSmsOtpSender.class);

    @Override
    public void send(String destination, String code) {
        log.debug("[DEV OTP][SMS] destination={} code={}", destination, code);
    }

    @Override
    public OtpChannel channel() {
        return OtpChannel.SMS;
    }
}
