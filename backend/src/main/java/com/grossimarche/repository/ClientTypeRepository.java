package com.grossimarche.repository;

import com.grossimarche.entity.ClientType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClientTypeRepository extends JpaRepository<ClientType, UUID> {

    Optional<ClientType> findBySlug(String slug);

    /**
     * Backs the case-insensitive uniqueness rule on the name. Returns the row rather than a
     * boolean so a rename can tell "taken by someone else" from "taken by me".
     */
    Optional<ClientType> findByNameIgnoreCase(String name);

    /** What the registration chooser offers, in the order the admin set. */
    List<ClientType> findAllByActiveTrueOrderBySortOrderAscNameAsc();

    /** Every segment, active or retired, for the back-office list. */
    List<ClientType> findAllByOrderBySortOrderAscNameAsc();
}
