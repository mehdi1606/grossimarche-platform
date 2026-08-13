package com.grossimarche.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * A physical cash-and-carry store. {@code openingHours} is a JSONB structure so clients
 * can compute a live Ouvert/Fermé indicator. Distance sorting is done in SQL, not Java.
 */
@Entity
@Table(name = "stores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Store extends BaseEntity {

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "city", nullable = false, length = 100)
    private String city;

    @Column(name = "address", nullable = false)
    private String address;

    @Column(name = "phone", length = 20)
    private String phone;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "opening_hours")
    private String openingHours;

    @Column(name = "lat", nullable = false)
    private double lat;

    @Column(name = "lng", nullable = false)
    private double lng;

    @Column(name = "active", nullable = false)
    private boolean active;
}
