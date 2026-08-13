package com.grossimarche.repository;

import com.grossimarche.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    /** Purge audit records older than the cutoff (data-retention job). Returns rows deleted. */
    long deleteByCreatedAtBefore(Instant cutoff);
}
