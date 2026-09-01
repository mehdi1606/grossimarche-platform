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
 * A commercial segment: patisserie, epicerie, laiterie, and whatever the admin adds next.
 *
 * A wholesaler does not sell at one price. The same crate of oil goes out to a pastry shop and
 * to a corner grocer at different rates, so the segment a customer belongs to is what selects
 * their price list - it is not a label, it is the key the whole catalogue is priced against.
 *
 * Deliberately a table rather than an enum: the segments are the merchant's business decision,
 * and a new one has to cost a form submission, not a release.
 */
@Entity
@Table(name = "client_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientType extends AuditableEntity {

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /**
     * Stable identifier derived from the name, but not tied to it: renaming the segment must
     * not break anything already pointing at it.
     */
    @Column(name = "slug", nullable = false, unique = true, length = 120)
    private String slug;

    @Column(name = "description", length = 500)
    private String description;

    /**
     * Icon key, not markup and not an emoji: "bakery", "dairy", "grocery".
     *
     * Each interface maps the key to its own component, so restyling the set is a front-end
     * change rather than a data migration - and unlike an emoji it renders the same on every
     * operating system, which is the least a shop sign should do.
     */
    @Column(name = "icon", length = 40)
    private String icon;

    /** Presentation order in the registration chooser. */
    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    /**
     * Whether the segment is still offered at registration.
     *
     * Retiring one never deletes it: existing customers belong to it and products are priced
     * against it. Inactive means "no new sign-ups here", not "gone".
     */
    @Column(name = "active", nullable = false)
    private boolean active;
}
