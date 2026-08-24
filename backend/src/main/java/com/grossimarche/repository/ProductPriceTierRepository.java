package com.grossimarche.repository;

import com.grossimarche.entity.ProductPriceTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface ProductPriceTierRepository extends JpaRepository<ProductPriceTier, UUID> {

    List<ProductPriceTier> findByProductIdOrderByMinQuantityAsc(UUID productId);

    void deleteByProductId(UUID productId);

    /** Which of the given products have at least one price tier (one query, no N+1). */
    @Query("select distinct t.product.id from ProductPriceTier t where t.product.id in :ids")
    Set<UUID> findProductIdsWithTiers(@Param("ids") Collection<UUID> ids);

    /**
     * Every tier for a page of products, in one query. The storefront needs the actual tiers
     * on list results, not just a "has discounts" flag: a product added to the cart from a
     * grid must be able to price itself, or the cart shows the base price for a quantity that
     * has already earned a lower one.
     */
    @Query("select t from ProductPriceTier t where t.product.id in :ids "
            + "order by t.product.id, t.minQuantity asc")
    List<ProductPriceTier> findByProductIds(@Param("ids") Collection<UUID> ids);
}
