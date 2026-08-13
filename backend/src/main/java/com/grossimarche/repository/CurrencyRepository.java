package com.grossimarche.repository;

import com.grossimarche.entity.Currency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CurrencyRepository extends JpaRepository<Currency, UUID> {

    List<Currency> findAllByOrderByCodeAsc();

    List<Currency> findByEnabledTrueOrderByCodeAsc();

    boolean existsByCodeIgnoreCase(String code);

    Optional<Currency> findByCodeIgnoreCase(String code);

    @Query("SELECT c FROM Currency c WHERE c.isDefault = true")
    Optional<Currency> findDefault();
}
