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
                       String ip, String userAgent, String metadata) {
        auditLogRepository.save(AuditLog.builder()
                .actorId(actorId)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .ip(ip)
                .userAgent(userAgent)
                .metadata(asJson(metadata))
                .build());
    }

    /**
     * Make any metadata safe for the JSONB column.
     *
     * The column is JSONB, so a caller passing a human sentence - "En attente de validation" -
     * made PostgreSQL reject the whole INSERT with {@code invalid input syntax for type json}.
     * Because audit writes run in REQUIRES_NEW, that failure did not stay contained either: it
     * surfaced as a 409 on the operation being audited, so registering a customer failed with a
     * duplicate-key error that had nothing to do with duplicates.
     *
     * Callers that already build JSON pass an object or an array, and those go through
     * untouched; anything else is a human string and is wrapped as {@code {"detail": "..."}}.
     * The shape is checked rather than parsed - no ObjectMapper is injected, because binding one
     * here means picking a Jackson generation, and this class has no business caring which one
     * the framework ships.
     *
     * An audit trail exists to record what happened, so the one unacceptable outcome is losing
     * the row - or breaking the caller - over the formatting of a note.
     */
    private String asJson(String metadata) {
        if (metadata == null || metadata.isBlank()) {
            return null;
        }
        String trimmed = metadata.trim();
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
            return trimmed;
        }
        return "{\"detail\":\"" + escape(trimmed) + "\"}";
    }

    /** Escape a string so it can sit inside JSON double quotes. */
    private String escape(String value) {
        StringBuilder out = new StringBuilder(value.length() + 16);
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            switch (c) {
                case '"' -> out.append("\\\"");
                case '\\' -> out.append("\\\\");
                case '\n' -> out.append("\\n");
                case '\r' -> out.append("\\r");
                case '\t' -> out.append("\\t");
                default -> {
                    if (c < 0x20) {
                        // Any other control character is illegal raw inside a JSON string.
                        out.append(String.format("\\u%04x", (int) c));
                    } else {
                        out.append(c);
                    }
                }
            }
        }
        return out.toString();
    }

    public void recordLogin(UUID userId, String ip, String userAgent) {
        record(userId, "LOGIN", "User", userId.toString(), ip, userAgent, null);
    }

    public void recordUserCreated(UUID userId, String ip, String userAgent) {
        record(userId, "USER_CREATED", "User", userId.toString(), ip, userAgent, null);
    }

    public void recordFailedOtp(String maskedDestination, String ip, String userAgent) {
        // Store only the masked destination - never the code, never the raw contact.
        record(null, "OTP_FAILED", "Otp", maskedDestination, ip, userAgent, null);
    }
}
