package com.grossimarche.repository;

import com.grossimarche.entity.Bundle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BundleRepository extends JpaRepository<Bundle, UUID> {

    Optional<Bundle> findBySlug(String slug);

    boolean existsBySlug(String slug);

    Page<Bundle> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /**
     * Every offer that may be applied right now. Fetches the items in the same query: callers
     * always need them (to price the set or to check the cart against it), and loading them
     * lazily one bundle at a time is the classic N+1 on a page that lists offers.
     */
    @Query("""
            select distinct b from Bundle b
            left join fetch b.items i
            left join fetch i.product
            where b.active = true
              and (b.startsAt is null or b.startsAt <= :moment)
              and (b.endsAt is null or b.endsAt > :moment)
            order by b.createdAt desc
            """)
    List<Bundle> findAvailable(Instant moment);

    /** One bundle with its items, for detail and editing. */
    @Query("""
            select distinct b from Bundle b
            left join fetch b.items i
            left join fetch i.product
            where b.id = :id
            """)
    Optional<Bundle> findByIdWithItems(UUID id);

    /** Available offers that contain a given product — shown on that product's page. */
    @Query("""
            select distinct b from Bundle b
            join b.items i
            where i.product.id = :productId
              and b.active = true
              and (b.startsAt is null or b.startsAt <= :moment)
              and (b.endsAt is null or b.endsAt > :moment)
            """)
    List<Bundle> findAvailableContainingProduct(UUID productId, Instant moment);
}
