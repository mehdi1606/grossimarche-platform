package com.grossimarche.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A district inside a delivered city.
 *
 * Not priced: a city is one round for one van, so the fee is the city's. Districts exist so an
 * address is picked from a list instead of typed - free-typed, "ain sebaa", "Aïn Sebaâ" and
 * "AinSebaa" are three different places to whoever is driving.
 */
@Entity
@Table(name = "delivery_districts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryDistrict extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "city_id", nullable = false)
    private DeliveryCity city;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    /**
      * This district's own rate, or null to follow its city.
      *
      * Null is the useful value: a district left alone tracks its city automatically, including
      * when the city's rate changes later. That is what makes twenty-one districts maintainable
      * instead of twenty-one numbers to remember to update.
      */
    @Column(name = "delivery_fee", precision = 12, scale = 2)
    private java.math.BigDecimal deliveryFee;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "active", nullable = false)
    private boolean active;
}
