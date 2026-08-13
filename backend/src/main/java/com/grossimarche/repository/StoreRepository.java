package com.grossimarche.repository;

import com.grossimarche.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface StoreRepository extends JpaRepository<Store, UUID> {

    List<Store> findByActiveTrue();

    /**
     * Active stores ordered by great-circle distance from the given point (haversine, in
     * SQL — never sorted in Java). {@code LEAST(1, …)} guards the {@code acos} domain.
     */
    @Query(value = """
            SELECT * FROM stores WHERE active = true ORDER BY
              (6371 * acos(LEAST(1, cos(radians(:lat)) * cos(radians(lat))
                 * cos(radians(lng) - radians(:lng))
                 + sin(radians(:lat)) * sin(radians(lat))))) ASC
            """, nativeQuery = true)
    List<Store> findActiveOrderByDistance(@Param("lat") double lat, @Param("lng") double lng);
}
