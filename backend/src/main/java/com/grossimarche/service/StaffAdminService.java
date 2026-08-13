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
import com.grossimarche.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;

/**
 * Back-office staff accounts, over the existing user model. Staff are users with role
 * ADMIN or STORE_MANAGER; there are no passwords — an invited member signs in by OTP on
 * the phone/email provided. Only an ADMIN may manage staff.
 */
@Service
public class StaffAdminService {

    private static final List<Role> STAFF_ROLES = List.of(Role.ADMIN, Role.STORE_MANAGER);

    private final UserRepository userRepository;

    public StaffAdminService(UserRepository userRepository) {
        this.userRepository = userRepository;
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
        if (phone == null && email == null) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Un téléphone ou un e-mail est requis pour créer un compte staff.");
        }
        if (phone != null && userRepository.existsByPhone(phone)) {
            throw new ConflictException("Ce numéro de téléphone est déjà utilisé.");
        }
        if (email != null && userRepository.existsByEmail(email)) {
            throw new ConflictException("Cet e-mail est déjà utilisé.");
        }
        User user = userRepository.save(User.builder()
                .fullName(trimToNull(req.fullName()))
                .phone(phone)
                .email(email)
                .role(req.role())
                .status(UserStatus.ACTIVE)
                .phoneVerified(false)
                .emailVerified(false)
                .build());
        return toResponse(user);
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

    /** Deactivate a staff account (blocks OTP login). Reversible by setting status ACTIVE. */
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

    private StaffResponse toResponse(User u) {
        return new StaffResponse(u.getId(), u.getFullName(), u.getPhone(), u.getEmail(),
                u.getRole(), u.getStatus(), u.getCreatedAt(), u.getLastLoginAt());
    }
}
