package com.grossimarche.service;

import com.grossimarche.dto.auth.RegisterRequest;
import com.grossimarche.dto.user.UserResponse;
import com.grossimarche.entity.ClientType;
import com.grossimarche.exception.ResourceNotFoundException;
import com.grossimarche.repository.ClientTypeRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Sign-up, from the storefront's point of view.
 *
 * Sits between the controller and {@link AuthService}: it resolves the chosen segment and
 * raises the back-office alert, leaving AuthService to own account creation and the password.
 * The alert is published rather than sent here so the applicant's request is not held open
 * while an e-mail is delivered.
 */
@Service
public class CustomerRegistrationService {

    private final AuthService authService;
    private final ClientTypeRepository clientTypeRepository;
    private final ApplicationEventPublisher events;

    public CustomerRegistrationService(AuthService authService,
                                       ClientTypeRepository clientTypeRepository,
                                       ApplicationEventPublisher events) {
        this.authService = authService;
        this.clientTypeRepository = clientTypeRepository;
        this.events = events;
    }

    @Transactional
    public UserResponse register(RegisterRequest req, String ip) {
        ClientType type = clientTypeRepository.findById(req.clientTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Type de client", req.clientTypeId()));

        UserResponse created = authService.register(req.fullName(), req.businessName(), req.email(),
                req.phone(), req.city(), type, req.password(), ip);

        // A pending account earns nothing until someone looks at it, so the back-office is told
        // straight away rather than discovering the queue on its next visit.
        events.publishEvent(new StaffAlertEvent(
                "Nouvelle demande de compte",
                req.businessName().trim() + " (" + type.getName() + ") attend une validation.",
                "/customers"));

        return created;
    }
}
