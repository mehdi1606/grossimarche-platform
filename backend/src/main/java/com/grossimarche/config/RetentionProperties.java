package com.grossimarche.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/** Data-retention schedule and periods. */
@ConfigurationProperties(prefix = "grossimarche.retention")
public record RetentionProperties(
        @DefaultValue("0 0 3 * * *") String cron,
        @DefaultValue("365") int auditLogDays
) {
}
