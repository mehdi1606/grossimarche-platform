package com.grossimarche.service;

import com.grossimarche.config.CacheConfig;
import com.grossimarche.dto.catalog.CsvImportReport;
import com.grossimarche.dto.catalog.PriceTierRequest;
import com.grossimarche.dto.catalog.PriceTierResponse;
import com.grossimarche.dto.catalog.ProductAttributeRequest;
import com.grossimarche.dto.catalog.ProductAttributeResponse;
import com.grossimarche.dto.catalog.ProductDetailResponse;
import com.grossimarche.dto.catalog.ProductFilter;
import com.grossimarche.dto.catalog.ProductRequest;
import com.grossimarche.dto.catalog.ProductSummaryResponse;
import com.grossimarche.dto.mapper.ProductMapper;
import com.grossimarche.entity.Category;
import com.grossimarche.entity.Product;
import com.grossimarche.entity.ProductAttribute;
import com.grossimarche.entity.ProductPriceTier;
import com.grossimarche.entity.ProductTypePrice;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ConflictException;
import com.grossimarche.exception.ErrorCode;
import com.grossimarche.exception.ResourceNotFoundException;
import com.grossimarche.repository.ProductAttributeRepository;
import com.grossimarche.repository.ProductPriceTierRepository;
import com.grossimarche.repository.ProductTypePriceRepository;
import com.grossimarche.repository.ProductRepository;
import com.grossimarche.repository.ProductReviewRepository;
import com.grossimarche.repository.spec.ProductSpecifications;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Catalogue product logic: public search/detail (detail cached) and admin CRUD, price
 * tiers, stock adjustment, CSV import and image upload. Writes evict the detail cache.
 */
@Service
public class ProductService {

    private static final Set<String> ALLOWED_IMAGE_TYPES =
            Set.of("image/png", "image/jpeg", "image/webp", "image/avif");

    /** A stock adjustment that lands at or below this level raises a LOW_STOCK notification. */
    private static final int LOW_STOCK_THRESHOLD = 10;

    private final ProductRepository productRepository;
    private final ProductPriceTierRepository priceTierRepository;
    private final ProductAttributeRepository attributeRepository;
    private final ProductReviewRepository reviewRepository;
    private final ProductMapper productMapper;
    private final CategoryService categoryService;
    private final AuditService auditService;
    private final com.grossimarche.integration.storage.StorageService storageService;
    private final com.grossimarche.config.StorageProperties storageProperties;
    private final ApplicationEventPublisher events;
    private final CatalogueViewer catalogueViewer;
    private final ProductTypePriceRepository typePriceRepository;
    private final PricingService pricingService;

    public ProductService(ProductRepository productRepository,
                          ProductPriceTierRepository priceTierRepository,
                          ProductAttributeRepository attributeRepository,
                          ProductReviewRepository reviewRepository, ProductMapper productMapper,
                          CategoryService categoryService, AuditService auditService,
                          com.grossimarche.integration.storage.StorageService storageService,
                          com.grossimarche.config.StorageProperties storageProperties,
                          ApplicationEventPublisher events, CatalogueViewer catalogueViewer,
                          ProductTypePriceRepository typePriceRepository,
                          PricingService pricingService) {
        this.productRepository = productRepository;
        this.priceTierRepository = priceTierRepository;
        this.attributeRepository = attributeRepository;
        this.reviewRepository = reviewRepository;
        this.productMapper = productMapper;
        this.categoryService = categoryService;
        this.auditService = auditService;
        this.storageService = storageService;
        this.storageProperties = storageProperties;
        this.events = events;
        this.catalogueViewer = catalogueViewer;
        this.typePriceRepository = typePriceRepository;
        this.pricingService = pricingService;
    }

    // ---- Public reads -----------------------------------------------------------------

    @Transactional(readOnly = true)
    public Page<ProductSummaryResponse> search(ProductFilter filter, Pageable pageable) {
        UUID clientTypeId = catalogueViewer.currentClientTypeId().orElse(null);

        List<Specification<Product>> specs = Stream.of(
                        ProductSpecifications.active(true),
                        // A product with no price for this segment is not sold to it, so it is
                        // not listed to it either. Null segment = no filter: an anonymous
                        // visitor browses everything, priceless.
                        ProductSpecifications.pricedForClientType(clientTypeId),
                        ProductSpecifications.inCategory(filter.categoryId()),
                        ProductSpecifications.matchesText(filter.q()),
                        ProductSpecifications.priceAtLeast(filter.minPrice()),
                        ProductSpecifications.priceAtMost(filter.maxPrice()),
                        ProductSpecifications.inStock(filter.inStock()))
                .filter(Objects::nonNull)
                .toList();
        Specification<Product> spec = specs.stream().reduce(Specification::and).orElse(null);

        Page<Product> page = productRepository.findAll(spec, pageable);
        if (!page.hasContent()) {
            return page.map(p -> productMapper.toPricelessSummary(p, false));
        }
        if (clientTypeId == null) {
            // No segment, no prices. The catalogue stays browsable - that is what brings people
            // to register - but every figure is withheld.
            return page.map(p -> productMapper.toPricelessSummary(p, p.getStockQuantity() > 0));
        }

        // Every ladder for the page in one query: the storefront prices the cart from these, so
        // a "has discounts" boolean would not do, and one query per row is an N+1 on every grid.
        Map<UUID, List<ProductTypePrice>> ladders = typePriceRepository
                .findForProductsAndType(page.getContent().stream().map(Product::getId).toList(),
                        clientTypeId)
                .stream()
                .collect(Collectors.groupingBy(t -> t.getProduct().getId()));

        return page.map(p -> toSegmentSummary(p, ladders.get(p.getId())));
    }

    // ---- Admin reads ------------------------------------------------------------------

    /**
     * Back-office product listing: same structured filters as the public search but WITHOUT
     * the active constraint, so inactive products are visible for management.
     */
    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional(readOnly = true)
    public Page<com.grossimarche.dto.catalog.AdminProductSummaryResponse> adminList(ProductFilter filter,
                                                                                    Pageable pageable) {
        List<Specification<Product>> specs = Stream.of(
                        ProductSpecifications.inCategory(filter.categoryId()),
                        ProductSpecifications.matchesText(filter.q()),
                        ProductSpecifications.priceAtLeast(filter.minPrice()),
                        ProductSpecifications.priceAtMost(filter.maxPrice()),
                        ProductSpecifications.inStock(filter.inStock()),
                        // Unset for ordinary management, where every product must be reachable.
                        // Set when the back-office is assembling something for one segment.
                        ProductSpecifications.pricedForClientType(filter.clientTypeId()))
                .filter(Objects::nonNull)
                .toList();
        Specification<Product> spec = specs.stream().reduce(Specification::and).orElse(null);
        return productRepository.findAll(spec, pageable).map(productMapper::toAdminSummary);
    }

    /**
     * Public product detail, priced for whoever is asking.
     *
     * The cache key carries the segment. Keyed on the slug alone, the first caller's prices
     * would be served to every other segment and to anonymous visitors - the whole grid leaking
     * through a cache hit.
     */
    @Cacheable(value = CacheConfig.PRODUCT_DETAIL,
            key = "#idOrSlug + '|' + @catalogueViewer.cacheKey()")
    @Transactional(readOnly = true)
    public ProductDetailResponse getDetail(String idOrSlug) {
        Product product = resolvePublic(idOrSlug);
        UUID clientTypeId = catalogueViewer.currentClientTypeId().orElse(null);
        double rating = reviewRepository.averageRating(product.getId());
        long reviews = reviewRepository.countByProductIdAndApprovedTrue(product.getId());

        if (clientTypeId == null) {
            return productMapper.toPricelessDetail(product, loadAttributes(product.getId()),
                    rating, reviews);
        }

        List<ProductTypePrice> ladder = typePriceRepository
                .findByProductIdAndClientTypeIdOrderByMinQuantityAsc(product.getId(), clientTypeId);
        if (ladder.isEmpty()) {
            // Priced for nobody here means sold to nobody here: a 404 rather than a page
            // advertising something this customer cannot buy.
            throw new ResourceNotFoundException("Produit", idOrSlug);
        }
        return productMapper.toDetail(product, toTierResponses(ladder), loadAttributes(product.getId()),
                rating, reviews, entryPrice(ladder), minimumFor(product, ladder));
    }

    /** A listing row priced for one segment. */
    private ProductSummaryResponse toSegmentSummary(Product product, List<ProductTypePrice> ladder) {
        if (ladder == null || ladder.isEmpty()) {
            return productMapper.toPricelessSummary(product, product.getStockQuantity() > 0);
        }
        return productMapper.toSummary(product, product.getStockQuantity() > 0,
                toTierResponses(ladder), entryPrice(ladder), minimumFor(product, ladder));
    }

    /**
     * The price shown before any quantity is chosen: the cheapest quantity this segment may
     * actually buy, which is not always one - some segments only buy by the case.
     */
    private BigDecimal entryPrice(List<ProductTypePrice> ladder) {
        int min = pricingService.minimumQuantity(ladder);
        return pricingService.resolveTypeUnitPrice(ladder, min).orElse(null);
    }

    /** The larger of the product's own minimum and the one the segment's ladder implies. */
    private int minimumFor(Product product, List<ProductTypePrice> ladder) {
        return Math.max(Math.max(product.getMinOrderQuantity(), 1),
                pricingService.minimumQuantity(ladder));
    }

    private List<PriceTierResponse> toTierResponses(List<ProductTypePrice> ladder) {
        return ladder.stream()
                .sorted(Comparator.comparingInt(ProductTypePrice::getMinQuantity))
                .map(r -> new PriceTierResponse(r.getId(), r.getMinQuantity(), r.getUnitPrice()))
                .toList();
    }

    /** Back-office detail: resolves by id regardless of the active flag (so hidden products
     *  remain editable and re-activatable). Not cached - admin edits must see fresh state. */
    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional(readOnly = true)
    public ProductDetailResponse adminGetDetail(UUID id) {
        Product product = getById(id);
        List<ProductPriceTier> tiers = priceTierRepository.findByProductIdOrderByMinQuantityAsc(id);
        return productMapper.toDetail(product, productMapper.toTiers(tiers), loadAttributes(id),
                reviewRepository.averageRating(id),
                reviewRepository.countByProductIdAndApprovedTrue(id));
    }

    // ---- Admin writes -----------------------------------------------------------------

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @CacheEvict(value = CacheConfig.PRODUCT_DETAIL, allEntries = true)
    @Transactional
    public ProductDetailResponse create(ProductRequest req) {
        if (productRepository.existsBySlug(req.slug())) {
            throw new ConflictException("Un produit avec ce slug existe déjà.");
        }
        Category category = categoryService.getById(req.categoryId());
        Product product = Product.builder()
                .category(category).name(req.name()).slug(req.slug()).description(req.description())
                .price(req.price()).unit(req.unit()).stockQuantity(req.stockQuantity())
                .minOrderQuantity(req.minOrderQuantity()).imageUrl(req.imageUrl()).active(req.active())
                .build();
        product = productRepository.save(product);
        return productMapper.toDetail(product, List.of(), List.of(), 0.0, 0);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @CacheEvict(value = CacheConfig.PRODUCT_DETAIL, allEntries = true)
    @Transactional
    public ProductDetailResponse update(UUID id, ProductRequest req) {
        Product product = getById(id);
        Category category = categoryService.getById(req.categoryId());
        product.setCategory(category);
        product.setName(req.name());
        product.setSlug(req.slug());
        product.setDescription(req.description());
        product.setPrice(req.price());
        product.setUnit(req.unit());
        product.setStockQuantity(req.stockQuantity());
        product.setMinOrderQuantity(req.minOrderQuantity());
        product.setImageUrl(req.imageUrl());
        product.setActive(req.active());
        List<ProductPriceTier> tiers = priceTierRepository.findByProductIdOrderByMinQuantityAsc(id);
        return productMapper.toDetail(product, productMapper.toTiers(tiers), loadAttributes(id),
                reviewRepository.averageRating(id), reviewRepository.countByProductIdAndApprovedTrue(id));
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @CacheEvict(value = CacheConfig.PRODUCT_DETAIL, allEntries = true)
    @Transactional
    public void deactivate(UUID id) {
        Product product = getById(id);
        product.setActive(false);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @CacheEvict(value = CacheConfig.PRODUCT_DETAIL, allEntries = true)
    @Transactional
    public ProductDetailResponse adjustStock(UUID id, int delta, String reason, UUID actorId) {
        Product product = getById(id);
        int newStock = product.getStockQuantity() + delta;
        if (newStock < 0) {
            throw new BusinessException(ErrorCode.INSUFFICIENT_STOCK,
                    "L'ajustement rendrait le stock négatif (actuel : " + product.getStockQuantity() + ").");
        }
        product.setStockQuantity(newStock);
        auditService.record(actorId, "STOCK_ADJUST", "Product", id.toString(), null, null,
                "{\"delta\":" + delta + ",\"reason\":\"" + reason.replace("\"", "'") + "\"}");
        // Warn staff when a decrease crosses into the low-stock zone (consumed AFTER_COMMIT).
        if (delta < 0 && newStock <= LOW_STOCK_THRESHOLD) {
            events.publishEvent(new LowStockEvent(product.getId(), product.getName(), newStock));
        }
        List<ProductPriceTier> tiers = priceTierRepository.findByProductIdOrderByMinQuantityAsc(id);
        return productMapper.toDetail(product, productMapper.toTiers(tiers), loadAttributes(id),
                reviewRepository.averageRating(id), reviewRepository.countByProductIdAndApprovedTrue(id));
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional(readOnly = true)
    public List<PriceTierResponse> listTiers(UUID productId) {
        getById(productId);
        return productMapper.toTiers(priceTierRepository.findByProductIdOrderByMinQuantityAsc(productId));
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @CacheEvict(value = CacheConfig.PRODUCT_DETAIL, allEntries = true)
    @Transactional
    public PriceTierResponse addTier(UUID productId, PriceTierRequest req) {
        Product product = getById(productId);
        boolean exists = priceTierRepository.findByProductIdOrderByMinQuantityAsc(productId).stream()
                .anyMatch(t -> t.getMinQuantity() == req.minQuantity());
        if (exists) {
            throw new ConflictException("Un palier existe déjà pour cette quantité minimale.");
        }
        ProductPriceTier tier = priceTierRepository.save(ProductPriceTier.builder()
                .product(product).minQuantity(req.minQuantity()).unitPrice(req.unitPrice()).build());
        return productMapper.toTier(tier);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @CacheEvict(value = CacheConfig.PRODUCT_DETAIL, allEntries = true)
    @Transactional
    public void deleteTier(UUID productId, UUID tierId) {
        ProductPriceTier tier = priceTierRepository.findById(tierId)
                .orElseThrow(() -> new ResourceNotFoundException("Palier", tierId));
        if (!tier.getProduct().getId().equals(productId)) {
            throw new ResourceNotFoundException("Palier", tierId);
        }
        priceTierRepository.delete(tier);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @CacheEvict(value = CacheConfig.PRODUCT_DETAIL, allEntries = true)
    @Transactional
    public String uploadImage(UUID id, byte[] content, String contentType, String filename) {
        Product product = getById(id);
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Type d'image non supporté (png, jpeg, webp, avif attendus).");
        }
        if (content.length == 0 || content.length > storageProperties.maxFileSizeBytes()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Fichier vide ou trop volumineux.");
        }
        String url = storageService.store(content, contentType, filename);
        product.setImageUrl(url);
        return url;
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @CacheEvict(value = CacheConfig.PRODUCT_DETAIL, allEntries = true)
    @Transactional
    public CsvImportReport importCsv(String csv) {
        String[] lines = csv.replace("\r\n", "\n").replace("\r", "\n").split("\n");
        List<CsvImportReport.RowError> errors = new ArrayList<>();
        List<Product> staged = new ArrayList<>();
        // Header: name;slug;categorySlug;description;price;unit;stockQuantity;minOrderQuantity;active
        for (int i = 1; i < lines.length; i++) {
            String line = lines[i];
            if (line.isBlank()) {
                continue;
            }
            int rowNumber = i + 1;
            String[] cols = line.split(";", -1);
            try {
                if (cols.length < 8) {
                    throw new IllegalArgumentException("8 colonnes attendues, " + cols.length + " trouvées");
                }
                String slug = cols[1].trim();
                if (productRepository.existsBySlug(slug) || staged.stream().anyMatch(p -> p.getSlug().equals(slug))) {
                    throw new IllegalArgumentException("slug déjà utilisé: " + slug);
                }
                Category category = categoryRepositoryLookup(cols[2].trim());
                staged.add(Product.builder()
                        .category(category)
                        .name(required(cols[0], "name"))
                        .slug(required(slug, "slug"))
                        .description(cols[3].trim())
                        .price(new BigDecimal(cols[4].trim()))
                        .unit(required(cols[5], "unit"))
                        .stockQuantity(Integer.parseInt(cols[6].trim()))
                        .minOrderQuantity(Integer.parseInt(cols[7].trim()))
                        .active(cols.length < 9 || Boolean.parseBoolean(cols[8].trim()))
                        .build());
            } catch (Exception e) {
                errors.add(new CsvImportReport.RowError(rowNumber, e.getMessage()));
            }
        }
        if (!errors.isEmpty()) {
            // No partial imports: reject the whole file (transaction rolls back on the exception).
            return new CsvImportReport(false, 0, errors);
        }
        productRepository.saveAll(staged);
        return new CsvImportReport(true, staged.size(), List.of());
    }

    // ---- Attributes -------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<ProductAttributeResponse> listAttributes(UUID productId) {
        getById(productId);
        return loadAttributes(productId);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @CacheEvict(value = CacheConfig.PRODUCT_DETAIL, allEntries = true)
    @Transactional
    public ProductAttributeResponse addAttribute(UUID productId, ProductAttributeRequest req) {
        Product product = getById(productId);
        ProductAttribute attribute = attributeRepository.save(ProductAttribute.builder()
                .product(product).name(req.name().trim()).value(req.value().trim())
                .displayOrder(req.displayOrder()).build());
        return productMapper.toAttribute(attribute);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @CacheEvict(value = CacheConfig.PRODUCT_DETAIL, allEntries = true)
    @Transactional
    public ProductAttributeResponse updateAttribute(UUID productId, UUID attributeId,
                                                    ProductAttributeRequest req) {
        ProductAttribute attribute = getAttribute(productId, attributeId);
        attribute.setName(req.name().trim());
        attribute.setValue(req.value().trim());
        attribute.setDisplayOrder(req.displayOrder());
        return productMapper.toAttribute(attribute);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @CacheEvict(value = CacheConfig.PRODUCT_DETAIL, allEntries = true)
    @Transactional
    public void deleteAttribute(UUID productId, UUID attributeId) {
        attributeRepository.delete(getAttribute(productId, attributeId));
    }

    private ProductAttribute getAttribute(UUID productId, UUID attributeId) {
        ProductAttribute attribute = attributeRepository.findById(attributeId)
                .orElseThrow(() -> new ResourceNotFoundException("Caractéristique", attributeId));
        if (!attribute.getProduct().getId().equals(productId)) {
            throw new ResourceNotFoundException("Caractéristique", attributeId);
        }
        return attribute;
    }

    private List<ProductAttributeResponse> loadAttributes(UUID productId) {
        return productMapper.toAttributes(attributeRepository.findByProductIdOrderByDisplayOrderAsc(productId));
    }

    // ---- Helpers ----------------------------------------------------------------------

    public Product getById(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit", id));
    }

    private Product resolvePublic(String idOrSlug) {
        return (isUuid(idOrSlug)
                ? productRepository.findByIdAndActiveTrue(UUID.fromString(idOrSlug))
                : productRepository.findBySlugAndActiveTrue(idOrSlug))
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable: " + idOrSlug));
    }

    private Category categoryRepositoryLookup(String slug) {
        return categoryService.getBySlug(slug);
    }

    private static boolean isUuid(String value) {
        try {
            UUID.fromString(value);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private static String required(String value, String field) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(field + " requis");
        }
        return value.trim();
    }

}
