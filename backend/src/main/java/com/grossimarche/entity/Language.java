package com.grossimarche.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A UI language the storefront exposes. Exactly one row is the default ({@code isDefault}).
 * ADMIN-managed configuration; only {@code enabled} languages are offered to shoppers.
 */
@Entity
@Table(name = "languages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Language extends AuditableEntity {

    @Column(name = "name", nullable = false, length = 60)
    private String name;

    @Column(name = "iso_code", nullable = false, unique = true, length = 10)
    private String isoCode;

    @Column(name = "flag", length = 255)
    private String flag;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault;

    @Column(name = "enabled", nullable = false)
    private boolean enabled;
}
