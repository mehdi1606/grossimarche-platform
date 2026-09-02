package com.grossimarche.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * A city the shop delivers to, and what that costs.
 *
 * The rate lives here rather than in application.yml, where it used to: fuel changes, a driver
 * leaves, a new round opens - none of that should need a redeploy.
 */
@Entity
@Table(name = "delivery_cities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryCity extends AuditableEntity {

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /** Stable key, so renaming the city never orphans an address pointing at it. */
    @Column(name = "slug", nullable = false, unique = true, length = 120)
    private String slug;

    /** What delivery here costs. Zero is a real answer - free delivery, not "unset". */
    @Column(name = "delivery_fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal deliveryFee;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    /** Suspending a city must never delete the addresses in it. */
    @Column(name = "active", nullable = false)
    private boolean active;

    @OneToMany(mappedBy = "city", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder asc, name asc")
    @Builder.Default
    private List<DeliveryDistrict> districts = new ArrayList<>();
}
