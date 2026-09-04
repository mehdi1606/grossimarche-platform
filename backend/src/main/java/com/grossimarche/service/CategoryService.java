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
import com.grossimarche.repository.ProductTypePriceRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/** Category reads (cached) and admin writes (cache-evicting). */
@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductTypePriceRepository typePriceRepository;
    private final CatalogueViewer catalogueViewer;
    private final CategoryMapper categoryMapper;
    private final CatalogueTranslator catalogueTranslator;

    public CategoryService(CategoryRepository categoryRepository, ProductRepository productRepository,
                           ProductTypePriceRepository typePriceRepository,
                           CatalogueViewer catalogueViewer,
                           CategoryMapper categoryMapper,
                           CatalogueTranslator catalogueTranslator) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.typePriceRepository = typePriceRepository;
        this.catalogueViewer = catalogueViewer;
        this.categoryMapper = categoryMapper;
        this.catalogueTranslator = catalogueTranslator;
    }

    /**
     * The categories a shopper is offered, and how much each holds.
     *
     * For a signed-in customer: only the categories carrying at least one product priced for
     * their segment, and the count is that segment's rather than the catalogue's. A pastry shop
     * has no business in "Poisson", and showing the aisle only to land them on an empty shelf is
     * worse than not showing it at all. One priced product is enough to bring a category back,
     * so a forgotten price costs that product and never the nine beside it.
     *
     * A visitor with no segment still sees everything, priceless - browsing is what brings
     * people to register.
     *
     * The cache key carries the segment. Keyed on nothing, as it was, the first caller's menu
     * would be served to every other segment: a grocer shown a pastry shop's aisles.
     */
    @Cacheable(value = CacheConfig.CATEGORIES, key = "@catalogueViewer.cacheKey()")
    @Transactional(readOnly = true)
    public List<CategoryResponse> listActive() {
        List<Category> active = categoryRepository.findByActiveTrueOrderByDisplayOrderAsc();
        UUID clientTypeId = catalogueViewer.currentClientTypeId().orElse(null);

        if (clientTypeId == null) {
            return active.stream()
                    .map(c -> categoryMapper.toResponse(c,
                            productRepository.countByCategoryIdAndActiveTrue(c.getId())))
                    .toList();
        }

        Map<UUID, Long> priced = typePriceRepository.countActiveProductsByCategory(clientTypeId)
                .stream()
                .filter(row -> row[0] != null)
                .collect(Collectors.toMap(row -> (UUID) row[0], row -> (Long) row[1]));

        return active.stream()
                .filter(c -> priced.containsKey(c.getId()))
                .map(c -> categoryMapper.toResponse(c, priced.get(c.getId()).intValue()))
                .toList();
    }

    /** Admin listing: every category (active and inactive) ordered for management. */
    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional(readOnly = true)
    public List<CategoryResponse> listAll() {
        return categoryRepository.findAll(Sort.by(Sort.Direction.ASC, "displayOrder")).stream()
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
                // Translated once here, not on every Arabic page view - see CatalogueTranslator.
                .name(req.name()).nameAr(catalogueTranslator.arabicFor(req.name(), req.nameAr()))
                .slug(req.slug()).icon(req.icon())
                .displayOrder(req.displayOrder()).active(req.active())
                .build();
        return categoryMapper.toResponse(categoryRepository.save(category), 0);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @CacheEvict(value = CacheConfig.CATEGORIES, allEntries = true)
    @Transactional
    public CategoryResponse update(UUID id, CategoryRequest req) {
        Category category = getById(id);
        // A rename in French makes the stored Arabic describe something else, so it is dropped
        // and translated again - unless the form sent a wording of its own, which always wins.
        boolean renamed = !req.name().equals(category.getName());
        String keep = req.nameAr() != null && !req.nameAr().isBlank()
                ? req.nameAr()
                : (renamed ? null : category.getNameAr());
        category.setName(req.name());
        category.setNameAr(catalogueTranslator.arabicFor(req.name(), keep));
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
