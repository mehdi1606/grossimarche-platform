package com.grossimarche.repository;

import com.grossimarche.entity.Attribute;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AttributeRepository extends JpaRepository<Attribute, UUID> {

    List<Attribute> findAllByOrderByNameAsc();

    List<Attribute> findByEnabledTrueOrderByNameAsc();

    boolean existsByNameIgnoreCase(String name);
}
