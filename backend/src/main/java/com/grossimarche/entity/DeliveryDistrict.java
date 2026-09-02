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

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "active", nullable = false)
    private boolean active;
}
