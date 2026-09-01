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
 * One rung of a segment's price ladder for a product.
 *
 * The row at {@code minQuantity == 1} is that segment's base price; rows above it are its
 * quantity breaks. Base price and tiers live in one table on purpose: as two, they could
 * disagree - a tier below the base at quantity 1, a base with no ladder - and every read would
 * have to reconcile them.
 *
 * Unique per {@code (product, clientType, minQuantity)}.
 */
@Entity
@Table(name = "product_type_prices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductTypePrice extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_type_id", nullable = false)
    private ClientType clientType;

    /** 1 for the segment's base price; higher for a quantity break. */
    @Column(name = "min_quantity", nullable = false)
    private int minQuantity;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;
}
