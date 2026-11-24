package com.grossimarche.repository;

import com.grossimarche.entity.DeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DeviceTokenRepository extends JpaRepository<DeviceToken, UUID> {

    Optional<DeviceToken> findByToken(String token);

    void deleteByToken(String token);

    /**
     * Every device of a set of customers, in one query - what an announcement needs, where
     * asking per customer would be one round trip a recipient.
     */
    @Query("select d.token from DeviceToken d where d.user.id in :userIds")
    List<String> findTokensByUserIds(Collection<UUID> userIds);

    /** The devices of one customer: an order of theirs moved, nobody else is told. */
    @Query("select d.token from DeviceToken d where d.user.id = :userId")
    List<String> findTokensByUserId(UUID userId);

    /** Drops tokens Firebase has refused as unregistered. */
    void deleteByTokenIn(Collection<String> tokens);

    /** Every device of one account - on erasure, where the user row itself survives anonymised. */
    void deleteByUserId(UUID userId);
}
