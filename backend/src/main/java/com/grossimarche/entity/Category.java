package com.grossimarche.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A product category (e.g. Riz, Huiles, Boissons). */
@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category extends BaseEntity {

    @Column(name = "name", nullable = false, length = 100)
    private String name;


    /**
     * Arabic name, written once when the category is saved rather than produced on every read.
     *
     * Null means "not translated yet": the storefront falls back to translating at display
     * time, as it always did, so filling the catalogue in can happen gradually.
     */
    @Column(name = "name_ar", length = 100)
    private String nameAr;

    @Column(name = "slug", nullable = false, unique = true, length = 120)
    private String slug;

    @Column(name = "icon", length = 60)
    private String icon;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "active", nullable = false)
    private boolean active;
}
