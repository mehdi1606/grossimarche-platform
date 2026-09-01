package com.grossimarche.repository;

import com.grossimarche.entity.BundleTypePrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BundleTypePriceRepository extends JpaRepository<BundleTypePrice, UUID> {

    Optional<BundleTypePrice> findByBundleIdAndClientTypeId(UUID bundleId, UUID clientTypeId);

    /** One bundle's price in every segment - what the back-office edits. */
    List<BundleTypePrice> findByBundleId(UUID bundleId);

    /** Prices for a set of bundles in one segment, in a single query. */
    @Query("""
            select b from BundleTypePrice b
            where b.bundle.id in :bundleIds and b.clientType.id = :clientTypeId
            """)
    List<BundleTypePrice> findForBundlesAndType(@Param("bundleIds") Collection<UUID> bundleIds,
                                                @Param("clientTypeId") UUID clientTypeId);

    void deleteByBundleId(UUID bundleId);

    boolean existsByClientTypeId(UUID clientTypeId);
}
