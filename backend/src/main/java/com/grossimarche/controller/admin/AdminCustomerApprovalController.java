package com.grossimarche.controller.admin;

import com.grossimarche.dto.customer.PendingCustomerResponse;
import com.grossimarche.service.CustomerApprovalService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/** The customer validation queue. Authorization is enforced on the service. */
@RestController
@RequestMapping("/api/v1/admin/customer-approvals")
public class AdminCustomerApprovalController {

    private final CustomerApprovalService approvalService;

    public AdminCustomerApprovalController(CustomerApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    @GetMapping
    public List<PendingCustomerResponse> pending() {
        return approvalService.listPending();
    }

    /** Badge count, so the back-office can show the queue without fetching it. */
    @GetMapping("/count")
    public Map<String, Long> count() {
        return Map.of("pending", approvalService.countPending());
    }

    /**
     * Approve, optionally correcting the segment the applicant chose - it selects their price
     * list, so a wrong one sells at the wrong price from the first order.
     */
    @PostMapping("/{id}/approve")
    public PendingCustomerResponse approve(@PathVariable UUID id,
                                           @RequestBody(required = false) ApproveRequest body) {
        return approvalService.approve(id, body == null ? null : body.clientTypeId());
    }

    @PostMapping("/{id}/reject")
    public PendingCustomerResponse reject(@PathVariable UUID id,
                                          @Valid @RequestBody RejectRequest body) {
        return approvalService.reject(id, body.reason());
    }

    public record ApproveRequest(UUID clientTypeId) {
    }

    /** The reason is mandatory: it is sent to the applicant. */
    public record RejectRequest(@NotBlank @Size(max = 500) String reason) {
    }
}
