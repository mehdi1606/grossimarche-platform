package com.grossimarche.repository;

import com.grossimarche.entity.LoyaltyAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

/** Keyed by the user's id (the account's primary key). */
public interface LoyaltyAccountRepository extends JpaRepository<LoyaltyAccount, UUID> {
}
