package com.grossimarche.controller.admin;

import com.grossimarche.dto.loyalty.LoyaltyAdjustmentRequest;
import com.grossimarche.security.SecurityUtils;
import com.grossimarche.service.AuditService;
import com.grossimarche.service.LoyaltyService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** Admin manual loyalty adjustments (reason mandatory, audit-logged). */
@RestController
@RequestMapping("/api/v1/admin/loyalty")
public class AdminLoyaltyController {

    private final LoyaltyService loyaltyService;
    private final AuditService auditService;

    public AdminLoyaltyController(LoyaltyService loyaltyService, AuditService auditService) {
        this.loyaltyService = loyaltyService;
        this.auditService = auditService;
    }

    @PostMapping("/{userId}/adjust")
    public ResponseEntity<Void> adjust(@PathVariable UUID userId,
                                       @Valid @RequestBody LoyaltyAdjustmentRequest body) {
        loyaltyService.adjust(userId, body.points(), body.reason());
        auditService.record(SecurityUtils.currentUserId(), "LOYALTY_ADJUST", "User", userId.toString(),
                null, null, "{\"points\":" + body.points() + "}");
        return ResponseEntity.noContent().build();
    }
}
