package com.grossimarche.repository;

import com.grossimarche.entity.LoyaltyTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface LoyaltyTransactionRepository extends JpaRepository<LoyaltyTransaction, UUID> {

    Page<LoyaltyTransaction> findByUserId(UUID userId, Pageable pageable);

    /** Sum of all ledger movements for a user - must equal the account balance (B7 invariant). */
    @Query("select coalesce(sum(t.points), 0) from LoyaltyTransaction t where t.user.id = :userId")
    int sumPointsByUserId(@Param("userId") UUID userId);
}
