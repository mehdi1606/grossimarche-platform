package com.grossimarche.service;

import com.grossimarche.dto.auth.RegisterRequest;
import com.grossimarche.dto.user.UserResponse;
import com.grossimarche.entity.ClientType;
import com.grossimarche.entity.enums.UserStatus;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ErrorCode;
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
    private final DeliveryZoneService deliveryZones;
    private final ApplicationEventPublisher events;

    public CustomerRegistrationService(AuthService authService,
                                       ClientTypeRepository clientTypeRepository,
                                       DeliveryZoneService deliveryZones,
                                       ApplicationEventPublisher events) {
        this.authService = authService;
        this.clientTypeRepository = clientTypeRepository;
        this.deliveryZones = deliveryZones;
        this.events = events;
    }

    @Transactional
    public UserResponse register(RegisterRequest req, String ip) {
        ClientType type = clientTypeRepository.findById(req.clientTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Type de client", req.clientTypeId()));

        // Refuse a city we do not serve. The form only offers delivered cities, so reaching
        // here means the payload was hand-made - and an account whose address cannot be
        // delivered to is a problem discovered at the first order instead of now.
        if (deliveryZones.rateFor(req.city(), req.district()).isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Nous ne livrons pas encore cette ville.");
        }

        UserResponse created = authService.register(req.fullName(), req.businessName(), req.email(),
                req.phone(), req.city(), req.district(), req.addressLine(), type, req.password(), ip);

        // A pending account earns nothing until someone looks at it, so the back-office is told
        // straight away rather than discovering the queue on its next visit. The listener turns
        // this into both a bell notification and the staff e-mail.
        events.publishEvent(new CustomerRegisteredEvent(
                created.id(),
                req.businessName().trim(),
                type.getName(),
                req.city(),
                req.email() != null && !req.email().isBlank() ? req.email() : req.phone(),
                created.status() != UserStatus.ACTIVE));

        return created;
    }
}
