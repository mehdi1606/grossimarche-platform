package com.grossimarche.repository;

import com.grossimarche.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

/**
 * Product queries. Dynamic filtering (category, text, price, stock) is composed from
 * {@link com.grossimarche.repository.spec.ProductSpecifications} via the
 * {@link JpaSpecificationExecutor} mix-in.
 */
public interface ProductRepository extends JpaRepository<Product, UUID>,
        JpaSpecificationExecutor<Product> {

    Optional<Product> findBySlug(String slug);

    Optional<Product> findByIdAndActiveTrue(UUID id);

    Optional<Product> findBySlugAndActiveTrue(String slug);

    boolean existsBySlug(String slug);

    long countByCategoryIdAndActiveTrue(UUID categoryId);

    /**
     * Atomically decrement stock only if enough is available. Returns 1 on success, 0 if
     * stock is insufficient. The {@code stock >= qty} guard plus the row lock during the
     * UPDATE make concurrent checkouts for the last unit resolve to exactly one winner —
     * stock can never go negative.
     */
    @Modifying(flushAutomatically = true)
    @Query("update Product p set p.stockQuantity = p.stockQuantity - :qty, p.version = p.version + 1 "
            + "where p.id = :id and p.stockQuantity >= :qty")
    int decrementStock(@Param("id") UUID id, @Param("qty") int qty);

    /** Restore stock on cancellation. */
    @Modifying(flushAutomatically = true)
    @Query("update Product p set p.stockQuantity = p.stockQuantity + :qty where p.id = :id")
    int incrementStock(@Param("id") UUID id, @Param("qty") int qty);
}
