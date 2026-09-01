package com.grossimarche.service;

import com.grossimarche.dto.customer.PendingCustomerResponse;
import com.grossimarche.entity.ClientType;
import com.grossimarche.entity.User;
import com.grossimarche.entity.enums.Role;
import com.grossimarche.entity.enums.UserStatus;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ErrorCode;
import com.grossimarche.exception.ResourceNotFoundException;
import com.grossimarche.repository.ClientTypeRepository;
import com.grossimarche.repository.UserRepository;
import com.grossimarche.security.SecurityUtils;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * The validation queue: shops that have registered and are waiting to be let in.
 *
 * Open to a store manager as well as an admin. Recognising a local business is exactly the kind
 * of daily judgement a manager makes - unlike deciding what the segments are, which is
 * commercial policy and stays ADMIN-only.
 */
@Service
public class CustomerApprovalService {

    private final UserRepository userRepository;
    private final ClientTypeRepository clientTypeRepository;
    private final AuditService auditService;
    private final ApplicationEventPublisher events;

    public CustomerApprovalService(UserRepository userRepository,
                                   ClientTypeRepository clientTypeRepository,
                                   AuditService auditService,
                                   ApplicationEventPublisher events) {
        this.userRepository = userRepository;
        this.clientTypeRepository = clientTypeRepository;
        this.auditService = auditService;
        this.events = events;
    }

    /** Oldest first: an application that has been waiting longest is the one costing goodwill. */
    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional(readOnly = true)
    public List<PendingCustomerResponse> listPending() {
        return userRepository.findByRoleAndStatusOrderByCreatedAtAsc(Role.CLIENT, UserStatus.PENDING)
                .stream()
                .map(PendingCustomerResponse::from)
                .toList();
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional(readOnly = true)
    public long countPending() {
        return userRepository.countByRoleAndStatus(Role.CLIENT, UserStatus.PENDING);
    }

    /**
     * Let a shop in.
     *
     * The segment may be corrected here: applicants pick their own trade at sign-up and get it
     * wrong, and since the segment selects the price list, approving a wrong one sells at the
     * wrong price from the first order.
     */
    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional
    public PendingCustomerResponse approve(UUID id, UUID clientTypeId) {
        User user = pending(id);

        if (clientTypeId != null) {
            ClientType type = clientTypeRepository.findById(clientTypeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Type de client", clientTypeId));
            user.setClientType(type);
        }
        if (user.getClientType() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Ce compte n'a pas de type de client : impossible de lui appliquer des prix.");
        }

        user.setStatus(UserStatus.ACTIVE);
        user.setApprovedAt(Instant.now());
        user.setApprovedBy(SecurityUtils.currentUserIdOptional().orElse(null));
        user.setRejectionReason(null);
        userRepository.save(user);

        auditService.record(SecurityUtils.currentUserIdOptional().orElse(null),
                "CUSTOMER_APPROVED", "User", id.toString(), null, null,
                user.getClientType().getName());
        events.publishEvent(new CustomerDecisionEvent(id, true, null));

        return PendingCustomerResponse.from(user);
    }

    /**
     * Turn an application down.
     *
     * The reason is required and reaches the applicant. A silent refusal produces a phone call
     * and a customer who thinks the site is broken.
     */
    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional
    public PendingCustomerResponse reject(UUID id, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Indiquez un motif : il est transmis au demandeur.");
        }
        User user = pending(id);
        user.setStatus(UserStatus.REJECTED);
        user.setRejectionReason(reason.trim());
        userRepository.save(user);

        auditService.record(SecurityUtils.currentUserIdOptional().orElse(null),
                "CUSTOMER_REJECTED", "User", id.toString(), null, null, reason.trim());
        events.publishEvent(new CustomerDecisionEvent(id, false, reason.trim()));

        return PendingCustomerResponse.from(user);
    }

    private User pending(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client", id));
        if (user.getRole() != Role.CLIENT) {
            throw new ResourceNotFoundException("Client", id);
        }
        if (user.getStatus() != UserStatus.PENDING) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Cette demande a déjà été traitée.");
        }
        return user;
    }
}
