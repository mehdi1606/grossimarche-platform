package com.grossimarche.repository;

import com.grossimarche.entity.ProductAttribute;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductAttributeRepository extends JpaRepository<ProductAttribute, UUID> {

    List<ProductAttribute> findByProductIdOrderByDisplayOrderAsc(UUID productId);
}
