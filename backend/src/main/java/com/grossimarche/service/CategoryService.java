package com.grossimarche.service;

import com.grossimarche.config.CacheConfig;
import com.grossimarche.dto.catalog.CategoryRequest;
import com.grossimarche.dto.catalog.CategoryResponse;
import com.grossimarche.dto.mapper.CategoryMapper;
import com.grossimarche.entity.Category;
import com.grossimarche.exception.ConflictException;
import com.grossimarche.exception.ResourceNotFoundException;
import com.grossimarche.repository.CategoryRepository;
import com.grossimarche.repository.ProductRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/** Category reads (cached) and admin writes (cache-evicting). */
@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final CategoryMapper categoryMapper;

    public CategoryService(CategoryRepository categoryRepository, ProductRepository productRepository,
                           CategoryMapper categoryMapper) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.categoryMapper = categoryMapper;
    }

    @Cacheable(CacheConfig.CATEGORIES)
    @Transactional(readOnly = true)
    public List<CategoryResponse> listActive() {
        return categoryRepository.findByActiveTrueOrderByDisplayOrderAsc().stream()
                .map(c -> categoryMapper.toResponse(c,
                        productRepository.countByCategoryIdAndActiveTrue(c.getId())))
                .toList();
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @CacheEvict(value = CacheConfig.CATEGORIES, allEntries = true)
    @Transactional
    public CategoryResponse create(CategoryRequest req) {
        if (categoryRepository.existsBySlug(req.slug())) {
            throw new ConflictException("Une catégorie avec ce slug existe déjà.");
        }
        Category category = Category.builder()
                .name(req.name()).slug(req.slug()).icon(req.icon())
                .displayOrder(req.displayOrder()).active(req.active())
                .build();
        return categoryMapper.toResponse(categoryRepository.save(category), 0);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @CacheEvict(value = CacheConfig.CATEGORIES, allEntries = true)
    @Transactional
    public CategoryResponse update(UUID id, CategoryRequest req) {
        Category category = getById(id);
        category.setName(req.name());
        category.setSlug(req.slug());
        category.setIcon(req.icon());
        category.setDisplayOrder(req.displayOrder());
        category.setActive(req.active());
        long count = productRepository.countByCategoryIdAndActiveTrue(id);
        return categoryMapper.toResponse(categoryRepository.save(category), count);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @CacheEvict(value = CacheConfig.CATEGORIES, allEntries = true)
    @Transactional
    public void delete(UUID id) {
        Category category = getById(id);
        // Deactivate rather than hard-delete: products keep their category reference.
        category.setActive(false);
        categoryRepository.save(category);
    }

    public Category getById(UUID id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie", id));
    }

    public Category getBySlug(String slug) {
        return categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie introuvable: " + slug));
    }
}
