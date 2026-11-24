package com.grossimarche.integration.push;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

/**
 * Picks the push sender from configuration.
 *
 * Done here rather than with {@code @ConditionalOnProperty} on the Firebase sender, because
 * that annotation treats a property set to the empty string as present: the Firebase client
 * was built with no key at all and logged a stack trace on every boot of a deployment that
 * had simply never configured push.
 */
@Configuration
public class PushConfig {

    private static final Logger log = LoggerFactory.getLogger(PushConfig.class);

    @Bean
    public PushSender pushSender(@Value("${grossimarche.push.credentials:}") String credentials) {
        if (!StringUtils.hasText(credentials)) {
            log.info("FIREBASE_CREDENTIALS is not set; push notifications are logged, not sent.");
            return new LoggingPushSender();
        }
        return new FirebasePushSender(credentials);
    }
}
