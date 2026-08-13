package com.grossimarche.service;

import com.grossimarche.config.RetentionProperties;
import com.grossimarche.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

/** Scheduled data-retention purge. Periods come from {@link RetentionProperties}. */
@Service
public class RetentionService {

    private static final Logger log = LoggerFactory.getLogger(RetentionService.class);

    private final AuditLogRepository auditLogRepository;
    private final RetentionProperties props;

    public RetentionService(AuditLogRepository auditLogRepository, RetentionProperties props) {
        this.auditLogRepository = auditLogRepository;
        this.props = props;
    }

    @Scheduled(cron = "${grossimarche.retention.cron:0 0 3 * * *}")
    @Transactional
    public void purgeStaleAuditLogs() {
        Instant cutoff = Instant.now().minus(Duration.ofDays(props.auditLogDays()));
        long deleted = auditLogRepository.deleteByCreatedAtBefore(cutoff);
        if (deleted > 0) {
            log.info("Retention: purged {} audit log rows older than {} days", deleted, props.auditLogDays());
        }
    }
}
