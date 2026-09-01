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

import java.math.BigDecimal;

/**
 * What a bundle costs one commercial segment.
 *
 * Priced per segment for the same reason products are: a basket that saves a pastry shop 12%
 * does not save a grocer the same, because its components do not cost them the same either.
 * A bundle with no row for a segment simply does not exist for it.
 */
@Entity
@Table(name = "bundle_type_prices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BundleTypePrice extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bundle_id", nullable = false)
    private Bundle bundle;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_type_id", nullable = false)
    private ClientType clientType;

    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal price;
}
