package com.grossimarche.service;

import com.grossimarche.dto.staff.CreateStaffRequest;
import com.grossimarche.dto.staff.StaffResponse;
import com.grossimarche.dto.staff.UpdateStaffRequest;
import com.grossimarche.entity.User;
import com.grossimarche.entity.enums.Role;
import com.grossimarche.entity.enums.UserStatus;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ConflictException;
import com.grossimarche.exception.ErrorCode;
import com.grossimarche.exception.ResourceNotFoundException;
import com.grossimarche.integration.email.Mailer;
import com.grossimarche.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Back-office staff accounts, over the existing user model. Staff are users with role ADMIN or
 * STORE_MANAGER, and unlike customers they sign in with e-mail + password: the back-office is
 * opened many times a day, where waiting on a one-time code each time is friction that buys no
 * extra safety for an account already restricted by role.
 *
 * Nobody types a password when creating an account. The server generates one, stores only its
 * hash, and e-mails it to the new member, who is required to replace it on first sign-in - so
 * a password is never chosen by a third party and cannot be read back later. Only an ADMIN may
 * manage staff.
 */
@Service
public class StaffAdminService {

    private static final List<Role> STAFF_ROLES = List.of(Role.ADMIN, Role.STORE_MANAGER);

    private final UserRepository userRepository;
    private final StaffPasswordService passwordService;
    private final Mailer mailer;
    private final AuditService auditService;

    public StaffAdminService(UserRepository userRepository, StaffPasswordService passwordService,
                             Mailer mailer, AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
        this.mailer = mailer;
        this.auditService = auditService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public Page<StaffResponse> list(Pageable pageable) {
        return userRepository.findByRoleInOrderByCreatedAtDesc(STAFF_ROLES, pageable).map(this::toResponse);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public StaffResponse create(CreateStaffRequest req) {
        requireStaffRole(req.role());
        String phone = trimToNull(req.phone());
        String email = trimToNull(req.email());
        if (email == null) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Un e-mail est requis : c'est l'identifiant de connexion et l'adresse où "
                            + "le mot de passe est envoyé.");
        }
        email = email.toLowerCase(Locale.ROOT);
        if (phone != null && userRepository.existsByPhone(phone)) {
            throw new ConflictException("Ce numéro de téléphone est déjà utilisé.");
        }
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new ConflictException("Cet e-mail est déjà utilisé.");
        }

        User user = User.builder()
                .fullName(trimToNull(req.fullName()))
                .phone(phone)
                .email(email)
                .role(req.role())
                .status(UserStatus.ACTIVE)
                .phoneVerified(false)
                .emailVerified(false)
                .build();

        String temporaryPassword = passwordService.generate();
        passwordService.assign(user, temporaryPassword, true);
        user = userRepository.save(user);

        boolean sent = mailer.sendStaffInvite(email, user.getFullName(), temporaryPassword);
        auditService.record(null, "STAFF_CREATED", "User", user.getId().toString(), null, null,
                invitationDetail(sent));

        // The clear-text password leaves the server exactly once, and only when we could not
        // e-mail it - otherwise the new account would be unreachable.
        return toResponse(user, sent, sent ? null : temporaryPassword);
    }

    /**
     * Issue a fresh temporary password for a staff member who lost theirs. The old one stops
     * working immediately; the replacement must be changed at the next sign-in.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public StaffResponse resetPassword(UUID id) {
        User user = getStaff(id);
        if (user.getEmail() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Ce compte n'a pas d'e-mail : impossible d'envoyer un mot de passe.");
        }
        String temporaryPassword = passwordService.generate();
        passwordService.assign(user, temporaryPassword, true);

        boolean sent = mailer.sendStaffInvite(user.getEmail(), user.getFullName(),
                temporaryPassword);
        auditService.record(null, "STAFF_PASSWORD_RESET", "User", id.toString(), null, null,
                invitationDetail(sent));
        return toResponse(user, sent, sent ? null : temporaryPassword);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public StaffResponse update(UUID id, UpdateStaffRequest req) {
        User user = getStaff(id);
        if (req.role() != null) {
            requireStaffRole(req.role());
            user.setRole(req.role());
        }
        if (req.status() != null) {
            user.setStatus(req.status());
        }
        return toResponse(user);
    }

    /** Deactivate a staff account (blocks sign-in). Reversible by setting status ACTIVE. */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void deactivate(UUID id) {
        getStaff(id).setStatus(UserStatus.BLOCKED);
    }

    private void requireStaffRole(Role role) {
        if (!STAFF_ROLES.contains(role)) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Le rôle doit être ADMIN ou STORE_MANAGER.");
        }
    }

    private User getStaff(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff", id));
        if (!STAFF_ROLES.contains(user.getRole())) {
            throw new ResourceNotFoundException("Staff", id);
        }
        return user;
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String invitationDetail(boolean sent) {
        return "{\"invitationSent\":" + sent + "}";
    }

    private StaffResponse toResponse(User u) {
        return toResponse(u, null, null);
    }

    private StaffResponse toResponse(User u, Boolean invitationSent, String temporaryPassword) {
        return new StaffResponse(u.getId(), u.getFullName(), u.getPhone(), u.getEmail(),
                u.getRole(), u.getStatus(), u.getCreatedAt(), u.getLastLoginAt(),
                invitationSent, temporaryPassword);
    }
}
