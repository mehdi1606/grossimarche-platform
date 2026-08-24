package com.grossimarche.entity;

import com.grossimarche.entity.enums.Role;
import com.grossimarche.entity.enums.UserStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * A registered account. At least one of {@code phone} / {@code email} is always present
 * (DB CHECK constraint). Personal identifiers are encrypted at rest in B8.
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends AuditableEntity {

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "phone", unique = true)
    private String phone;

    @Column(name = "email", unique = true)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private UserStatus status;

    @Column(name = "phone_verified", nullable = false)
    private boolean phoneVerified;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified;

    @Column(name = "consent_at")
    private Instant consentAt;

    @Column(name = "consent_version", length = 20)
    private String consentVersion;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    /**
     * BCrypt hash, or {@code null} for an account that cannot sign in with a password.
     * Customers are always null — the storefront is passwordless (OTP) and stays that way;
     * this exists for back-office accounts, which sign in with e-mail + password.
     */
    @Column(name = "password_hash", length = 100)
    private String passwordHash;

    @Column(name = "password_updated_at")
    private Instant passwordUpdatedAt;

    /** True while the account is still on a password the system generated for it. */
    @Column(name = "must_change_password", nullable = false)
    private boolean mustChangePassword;
}
