package com.grossimarche.repository;

import com.grossimarche.entity.Language;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LanguageRepository extends JpaRepository<Language, UUID> {

    List<Language> findAllByOrderByNameAsc();

    List<Language> findByEnabledTrueOrderByNameAsc();

    boolean existsByIsoCodeIgnoreCase(String isoCode);

    Optional<Language> findByIsoCodeIgnoreCase(String isoCode);

    @Query("SELECT l FROM Language l WHERE l.isDefault = true")
    Optional<Language> findDefault();
}
