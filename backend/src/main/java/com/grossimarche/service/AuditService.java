package com.grossimarche.service;

import com.grossimarche.entity.AuditLog;
import com.grossimarche.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Append-only audit trail (login, failed OTP, admin actions, data export/erasure…).
 * Writes run in their own transaction ({@code REQUIRES_NEW}) so an audit failure never
 * rolls back the business operation, and a business rollback never erases the audit record.
 * Expanded in B8.
 */
@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(UUID actorId, String action, String entityType, String entityId,
                       String ip, String userAgent, String metadataJson) {
        auditLogRepository.save(AuditLog.builder()
                .actorId(actorId)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .ip(ip)
                .userAgent(userAgent)
                .metadata(metadataJson)
                .build());
    }

    public void recordLogin(UUID userId, String ip, String userAgent) {
        record(userId, "LOGIN", "User", userId.toString(), ip, userAgent, null);
    }

    public void recordUserCreated(UUID userId, String ip, String userAgent) {
        record(userId, "USER_CREATED", "User", userId.toString(), ip, userAgent, null);
    }

    public void recordFailedOtp(String maskedDestination, String ip, String userAgent) {
        // Store only the masked destination — never the code, never the raw contact.
        record(null, "OTP_FAILED", "Otp", maskedDestination, ip, userAgent, null);
    }
}
