package com.grossimarche.integration.push;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

/**
 * What runs when Firebase is not configured: the notification is written to the log and
 * nothing leaves the server.
 *
 * The log line is deliberately explicit. A silent no-op is how a feature ends up believed
 * broken for a week, and this project has already spent one that way on e-mail.
 */
class LoggingPushSender implements PushSender {

    private static final Logger log = LoggerFactory.getLogger(LoggingPushSender.class);

    @Override
    public List<String> send(List<String> tokens, String title, String body,
                             Map<String, String> data) {
        if (tokens == null || tokens.isEmpty()) {
            return List.of();
        }
        log.info("Push is not configured; '{}' was NOT sent to {} device(s). "
                + "Set FIREBASE_CREDENTIALS to deliver it.", title, tokens.size());
        return List.of();
    }
}
