package com.grossimarche.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * A bundle offer - a "panier": several products sold together for less than the sum of their
 * individual prices.
 *
 * A bundle is a pricing *rule*, not a sellable product. It never becomes an order line: when
 * a cart contains all of its components, checkout applies the saving as a discount. That keeps
 * stock, price and reporting anchored on the real products and means a bundle can be edited or
 * withdrawn without touching a single past order.
 */
@Entity
@Table(name = "bundles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bundle extends AuditableEntity {

    @Column(name = "name", nullable = false, length = 150)
    private String name;


    /**
     * Arabic name, written once when the bundle is saved rather than produced on every read.
     *
     * Null means "not translated yet": the storefront falls back to translating at display
     * time, as it always did, so filling the catalogue in can happen gradually.
     */
    @Column(name = "name_ar", length = 150)
    private String nameAr;

    @Column(name = "slug", nullable = false, unique = true, length = 180)
    private String slug;

    @Column(name = "description", length = 1000)
    private String description;

    /** Arabic description. Same rule as {@link #nameAr}. */
    @Column(name = "description_ar", length = 1000)
    private String descriptionAr;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    /** What the whole set costs. Always below the sum of the components' list prices. */
    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "active", nullable = false)
    private boolean active;

    /** Optional availability window; a null bound means "no limit on that side". */
    @Column(name = "starts_at")
    private Instant startsAt;

    @Column(name = "ends_at")
    private Instant endsAt;

    @Builder.Default
    @OneToMany(mappedBy = "bundle", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BundleItem> items = new ArrayList<>();

    /** Whether the offer may be applied right now: enabled, and inside its window. */
    public boolean isAvailableAt(Instant moment) {
        return active
                && (startsAt == null || !moment.isBefore(startsAt))
                && (endsAt == null || moment.isBefore(endsAt));
    }
}
