package com.grossimarche.repository;

import com.grossimarche.entity.DeliveryCity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DeliveryCityRepository extends JpaRepository<DeliveryCity, UUID> {

    Optional<DeliveryCity> findBySlug(String slug);

    Optional<DeliveryCity> findByNameIgnoreCase(String name);

    /**
     * Every city with its districts in one query.
     *
     * Both interfaces always want them together - the back-office to edit a round, the address
     * form to fill two selects - and lazily loading districts city by city is an N+1 on a page
     * that is one screen of data.
     */
    @Query("""
            select distinct c from DeliveryCity c
            left join fetch c.districts
            order by c.sortOrder asc, c.name asc
            """)
    List<DeliveryCity> findAllWithDistricts();

    @Query("""
            select distinct c from DeliveryCity c
            left join fetch c.districts d
            where c.active = true and (d is null or d.active = true)
            order by c.sortOrder asc, c.name asc
            """)
    List<DeliveryCity> findActiveWithDistricts();
}
