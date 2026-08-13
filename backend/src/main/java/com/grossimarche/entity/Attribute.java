package com.grossimarche.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * A reusable attribute definition in the catalogue (e.g. Marque, Conditionnement) with its
 * allowed {@link AttributeValue values}. Managed by ADMIN and STORE_MANAGER; the storefront
 * reads enabled attributes to build filters.
 */
@Entity
@Table(name = "attributes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attribute extends AuditableEntity {

    @Column(name = "name", nullable = false, length = 80)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private com.grossimarche.entity.enums.AttributeType type;

    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    @OneToMany(mappedBy = "attribute", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<AttributeValue> values = new ArrayList<>();

    /** Replace the whole value set (used on update); keeps the bidirectional link consistent. */
    public void replaceValues(List<AttributeValue> newValues) {
        this.values.clear();
        if (newValues != null) {
            newValues.forEach(this::addValue);
        }
    }

    public void addValue(AttributeValue value) {
        value.setAttribute(this);
        this.values.add(value);
    }
}
