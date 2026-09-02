package com.grossimarche.repository;

import com.grossimarche.entity.ProductTypePrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface ProductTypePriceRepository extends JpaRepository<ProductTypePrice, UUID> {

    /** One product's ladder for one segment, cheapest threshold first. */
    List<ProductTypePrice> findByProductIdAndClientTypeIdOrderByMinQuantityAsc(
            UUID productId, UUID clientTypeId);

    /** One product's whole grid, every segment - what the back-office edits. */
    List<ProductTypePrice> findByProductIdOrderByClientTypeIdAscMinQuantityAsc(UUID productId);

    /**
     * The ladders for a page of products, for one segment, in a single query.
     *
     * A listing needs the actual rungs, not just "this is priced": a product added to the cart
     * from a grid has to be able to price itself, or the cart shows the base price for a
     * quantity that has already earned a lower one.
     */
    @Query("""
            select p from ProductTypePrice p
            where p.product.id in :productIds and p.clientType.id = :clientTypeId
            order by p.product.id, p.minQuantity asc
            """)
    List<ProductTypePrice> findForProductsAndType(@Param("productIds") Collection<UUID> productIds,
                                                  @Param("clientTypeId") UUID clientTypeId);

    /**
     * Which of these products are priced at all for this segment.
     *
     * Drives visibility: with no fallback price, a product absent from this set must not be
     * shown to that segment.
     */
    @Query("""
            select distinct p.product.id from ProductTypePrice p
            where p.product.id in :productIds and p.clientType.id = :clientTypeId
            """)
    Set<UUID> findPricedProductIds(@Param("productIds") Collection<UUID> productIds,
                                   @Param("clientTypeId") UUID clientTypeId);

    /** Product ids that carry at least one price for the segment - catalogue-wide. */
    @Query("select distinct p.product.id from ProductTypePrice p where p.clientType.id = :clientTypeId")
    Set<UUID> findAllPricedProductIds(@Param("clientTypeId") UUID clientTypeId);

    /**
     * Segments this product is priced for. The back-office shows it as "not priced for X" so an
     * admin sees why a product is missing from a segment's catalogue instead of guessing.
     */
    @Query("select distinct p.clientType.id from ProductTypePrice p where p.product.id = :productId")
    Set<UUID> findPricedClientTypeIds(@Param("productId") UUID productId);

    /**
     * How many active products each category holds *for this segment*.
     *
     * Drives which categories a customer is shown at all. A category with no row here does not
     * exist for them: a pastry shop has no business in "Poisson", and offering the aisle only to
     * land them on an empty shelf is worse than not offering it.
     *
     * Counted in one grouped query rather than per category, which would be an N+1 on a menu
     * rendered at the top of every page.
     */
    @Query("""
            select p.product.category.id, count(distinct p.product.id)
            from ProductTypePrice p
            where p.clientType.id = :clientTypeId and p.product.active = true
            group by p.product.category.id
            """)
    List<Object[]> countActiveProductsByCategory(@Param("clientTypeId") UUID clientTypeId);

    void deleteByProductIdAndClientTypeId(UUID productId, UUID clientTypeId);

    void deleteByProductId(UUID productId);

    boolean existsByClientTypeId(UUID clientTypeId);
}
