package com.grossimarche.service;

import com.grossimarche.dto.bundle.BundleItemRequest;
import com.grossimarche.dto.bundle.BundleItemResponse;
import com.grossimarche.dto.bundle.BundleRequest;
import com.grossimarche.dto.bundle.BundleResponse;
import com.grossimarche.dto.review.ProductRating;
import com.grossimarche.entity.Bundle;
import com.grossimarche.entity.BundleItem;
import com.grossimarche.entity.BundleTypePrice;
import com.grossimarche.entity.Product;
import com.grossimarche.entity.ProductTypePrice;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ConflictException;
import com.grossimarche.exception.ErrorCode;
import com.grossimarche.exception.ResourceNotFoundException;
import com.grossimarche.config.StorageProperties;
import com.grossimarche.integration.storage.StorageService;
import com.grossimarche.repository.BundleRepository;
import com.grossimarche.repository.BundleTypePriceRepository;
import com.grossimarche.repository.ProductRepository;
import com.grossimarche.repository.ProductReviewRepository;
import com.grossimarche.repository.ProductTypePriceRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.Set;
import java.util.UUID;

/**
 * Bundle offers ("paniers") - a named set of products sold together below the sum of its parts.
 *
 * The offer is a pricing rule rather than a sellable item: nothing new enters the cart or the
 * order lines. {@link #computeDiscount} looks at what is already in the cart and returns the
 * saving to apply. Stock, prices and reporting therefore stay anchored on the real products,
 * and an offer can be edited or withdrawn without rewriting a single past order.
 */
@Service
public class BundleService {

    /** Same set the product uploader accepts - one rule for every image in the catalogue. */
    private static final Set<String> ALLOWED_IMAGE_TYPES =
            Set.of("image/png", "image/jpeg", "image/webp", "image/avif");

    private final BundleRepository bundleRepository;
    private final CatalogueViewer catalogueViewer;
    private final PricingService pricingService;
    private final BundleTypePriceRepository bundlePriceRepository;
    private final ProductTypePriceRepository productPriceRepository;
    private final ProductRepository productRepository;
    private final StorageService storageService;
    private final StorageProperties storageProperties;
    private final ApplicationEventPublisher events;
    private final CatalogueTranslator catalogueTranslator;
    private final ProductReviewRepository reviewRepository;

    public BundleService(BundleRepository bundleRepository, ProductRepository productRepository,
                         CatalogueViewer catalogueViewer, PricingService pricingService,
                         BundleTypePriceRepository bundlePriceRepository,
                         ProductTypePriceRepository productPriceRepository,
                         StorageService storageService, StorageProperties storageProperties,
                         ApplicationEventPublisher events,
                         CatalogueTranslator catalogueTranslator,
                         ProductReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
        this.bundleRepository = bundleRepository;
        this.catalogueViewer = catalogueViewer;
        this.pricingService = pricingService;
        this.bundlePriceRepository = bundlePriceRepository;
        this.productPriceRepository = productPriceRepository;
        this.productRepository = productRepository;
        this.storageService = storageService;
        this.storageProperties = storageProperties;
        this.events = events;
        this.catalogueTranslator = catalogueTranslator;
    }

    // ---- Reads -------------------------------------------------------------------------

    /** Offers a shopper may order right now. */
    @Transactional(readOnly = true)
    public List<BundleResponse> listAvailable() {
        return bundleRepository.findAvailable(Instant.now()).stream().map(this::toResponse).toList();
    }

    /** Available offers that include a given product - shown on that product's page. */
    @Transactional(readOnly = true)
    public List<BundleResponse> listContainingProduct(UUID productId) {
        return bundleRepository.findAvailableContainingProduct(productId, Instant.now())
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public BundleResponse getBySlug(String slug) {
        return toResponse(bundleRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Offre", slug)));
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional(readOnly = true)
    public Page<BundleResponse> listAll(Pageable pageable) {
        return bundleRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toAdminResponse);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional(readOnly = true)
    public BundleResponse get(UUID id) {
        return toAdminResponse(withItems(id));
    }

    // ---- Writes ------------------------------------------------------------------------

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional
    public BundleResponse create(BundleRequest req) {
        // Translated once here, not on every Arabic page view - see CatalogueTranslator.
        String[] arabic = catalogueTranslator.arabicFor(
                req.name(), req.nameAr(), req.description(), req.descriptionAr());
        Bundle bundle = Bundle.builder()
                .name(req.name().trim())
                .nameAr(arabic[0])
                .slug(uniqueSlug(req.name(), null))
                .description(trimToNull(req.description()))
                .descriptionAr(arabic[1])
                .imageUrl(trimToNull(req.imageUrl()))
                .price(req.price())
                .active(req.active() == null || req.active())
                .startsAt(req.startsAt())
                .endsAt(req.endsAt())
                .build();
        applyItems(bundle, req.items());
        validatePrice(bundle);
        return toAdminResponse(bundleRepository.save(bundle));
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional
    public BundleResponse update(UUID id, BundleRequest req) {
        Bundle bundle = withItems(id);
        boolean renamed = !bundle.getName().equalsIgnoreCase(req.name().trim());
        bundle.setName(req.name().trim());
        if (renamed) {
            bundle.setSlug(uniqueSlug(req.name(), bundle.getId()));
        }
        // Renaming in French leaves the old Arabic describing the old offer, so it is dropped
        // and translated again - unless the form sent its own wording, which always wins.
        boolean rewritten = !java.util.Objects.equals(
                trimToNull(req.description()), bundle.getDescription());
        String[] arabic = catalogueTranslator.arabicFor(
                req.name(), req.nameAr() != null && !req.nameAr().isBlank()
                        ? req.nameAr() : (renamed ? null : bundle.getNameAr()),
                req.description(), req.descriptionAr() != null && !req.descriptionAr().isBlank()
                        ? req.descriptionAr() : (rewritten ? null : bundle.getDescriptionAr()));
        bundle.setNameAr(arabic[0]);
        bundle.setDescription(trimToNull(req.description()));
        bundle.setDescriptionAr(arabic[1]);
        bundle.setImageUrl(trimToNull(req.imageUrl()));
        bundle.setPrice(req.price());
        if (req.active() != null) {
            bundle.setActive(req.active());
        }
        bundle.setStartsAt(req.startsAt());
        bundle.setEndsAt(req.endsAt());
        applyItems(bundle, req.items());
        validatePrice(bundle);
        return toAdminResponse(bundle);
    }

    /**
     * Store an uploaded image and attach it to the bundle.
     *
     * The same path products use, so an offer's picture is served from our own storage at
     * {@code /files/} rather than depending on someone pasting a URL that may rot.
     */
    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional
    public String uploadImage(UUID id, byte[] content, String contentType, String filename) {
        Bundle bundle = withItems(id);
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Type d'image non supporté (png, jpeg, webp, avif attendus).");
        }
        if (content.length == 0 || content.length > storageProperties.maxFileSizeBytes()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Fichier vide ou trop volumineux.");
        }
        String url = storageService.store(content, contentType, filename);
        bundle.setImageUrl(url);
        return url;
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional
    public void delete(UUID id) {
        if (!bundleRepository.existsById(id)) {
            throw new ResourceNotFoundException("Offre", id);
        }
        bundleRepository.deleteById(id);
    }

    /**
     * Announce an offer to the customers it is actually sold to.
     *
     * Deliberately a separate, explicit action rather than a side effect of saving: an offer is
     * edited several times before it is right, and every save must not become a mailshot.
     *
     * The announcement follows the price grid: a bundle is priced per trade, so only the trades
     * it carries a price for are written to. It used to go to every active customer, which meant
     * most recipients opened an offer page that had nothing on sale to them.
     *
     * @return the offer as the back-office shows it
     */
    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional
    public BundleResponse announce(UUID id) {
        Bundle bundle = withItems(id);
        if (!bundle.isAvailableAt(Instant.now())) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Cette offre n'est pas active : activez-la avant de l'annoncer.");
        }

        List<BundleTypePrice> priced = bundlePriceRepository.findByBundleId(bundle.getId());
        if (priced.isEmpty()) {
            // Nobody can buy it, so there is nobody to tell.
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Cette offre n'a aucun prix : choisissez un type d'activité et fixez son "
                            + "prix avant de l'annoncer.");
        }
        // A price on the bundle is not enough: the offer is only buyable by a trade that can
        // also buy every product inside it (see render(), where one unpriced component makes
        // the whole set unavailable). Announcing to such a trade would send them to an offer
        // the storefront shows as impossible to order.
        List<BundleTypePrice> sellable = priced.stream()
                .filter(row -> fullyPricedFor(bundle, row.getClientType().getId()))
                .toList();
        if (sellable.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Les produits de ce panier n'ont pas tous un prix pour le type d'activité "
                            + "choisi : complétez la grille tarifaire avant de l'annoncer.");
        }
        return publish(bundle, sellable);
    }

    /**
     * Announce an offer by itself, the first time it becomes sellable.
     *
     * Called when the price grid is saved, which is the moment a bundle stops being a draft:
     * before it, there is no price and no audience to write to. An offer used to sit live and
     * silent unless someone thought to press "Annoncer", so new baskets reached nobody.
     *
     * Silent about everything it cannot do - already announced, still inactive, not priced for
     * a trade that can buy it. None of those is a reason to fail the save the operator asked
     * for; the manual button is there to say why, out loud, when they want it.
     */
    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional
    public void announceIfNew(UUID id) {
        Bundle bundle = bundleRepository.findByIdWithItems(id).orElse(null);
        if (bundle == null || bundle.getAnnouncedAt() != null
                || !bundle.isAvailableAt(Instant.now())) {
            return;
        }
        List<BundleTypePrice> sellable = bundlePriceRepository.findByBundleId(id).stream()
                .filter(row -> fullyPricedFor(bundle, row.getClientType().getId()))
                .toList();
        if (!sellable.isEmpty()) {
            publish(bundle, sellable);
        }
    }

    /**
     * Stamp the offer as announced and hand the mail layer everything it needs.
     *
     * The stamp is written inside the same transaction as the event, so an announcement that
     * rolls back is not recorded - and the listener only fires AFTER_COMMIT, so one that is
     * recorded really was sent for.
     */
    private BundleResponse publish(Bundle bundle, List<BundleTypePrice> sellable) {
        List<UUID> segments = sellable.stream()
                .map(row -> row.getClientType().getId())
                .distinct()
                .toList();
        String audience = sellable.stream()
                .map(row -> row.getClientType().getName())
                .distinct()
                .collect(Collectors.joining(", "));

        BundleResponse response = toAdminResponse(bundle);
        bundle.setAnnouncedAt(Instant.now());
        events.publishEvent(new BundleAnnouncedEvent(bundle.getId(), bundle.getName(),
                bundle.getSlug(), response.price(), response.savings(), segments, audience,
                announcedItems(response)));
        return response;
    }

    /**
     * The basket's contents as the announcement shows them: already priced for the trade it is
     * sold to, and carrying what customers think of each product.
     *
     * Ratings are fetched for the whole basket in one query. Asking per product would be two
     * round trips a line, on a path that already runs after the transaction that mattered.
     */
    private List<BundleAnnouncedEvent.Item> announcedItems(BundleResponse response) {
        List<BundleItemResponse> items = response.items();
        if (items.isEmpty()) {
            return List.of();
        }
        Map<UUID, ProductRating> ratings = reviewRepository
                .ratingsFor(items.stream().map(BundleItemResponse::productId).toList())
                .stream()
                .collect(Collectors.toMap(ProductRating::productId, r -> r));

        return items.stream()
                .map(item -> {
                    ProductRating rating = ratings.get(item.productId());
                    return new BundleAnnouncedEvent.Item(
                            item.name(), item.imageUrl(), item.unit(), item.quantity(),
                            item.unitPrice(), item.lineTotal(),
                            rating == null ? 0d : rating.average(),
                            rating == null ? 0L : rating.count());
                })
                .toList();
    }

    /**
     * Can this trade buy every product in the basket?
     *
     * Same resolution the storefront uses, quantity ladder included: a component priced only
     * from 10 units up is not "priced" for a basket that takes 3 of it.
     */
    private boolean fullyPricedFor(Bundle bundle, UUID clientTypeId) {
        Map<UUID, List<ProductTypePrice>> ladders = productPriceRepository
                .findForProductsAndType(
                        bundle.getItems().stream().map(i -> i.getProduct().getId()).toList(),
                        clientTypeId)
                .stream()
                .collect(Collectors.groupingBy(row -> row.getProduct().getId()));

        return bundle.getItems().stream().allMatch(item -> pricingService
                .resolveTypeUnitPrice(ladders.get(item.getProduct().getId()), item.getQuantity())
                .isPresent());
    }

    // ---- Pricing -----------------------------------------------------------------------

    /** One cart line, priced as checkout priced it (quantity tiers already applied). */
    public record CartLine(UUID productId, int quantity, BigDecimal effectiveUnitPrice) {
    }

    /** One offer that the cart qualified for. */
    public record AppliedBundle(UUID bundleId, String name, int sets, BigDecimal discount) {
    }

    public record BundleDiscount(BigDecimal total, List<AppliedBundle> applied) {

        public static BundleDiscount none() {
            return new BundleDiscount(BigDecimal.ZERO, List.of());
        }
    }

    /**
     * The saving a cart has earned from bundle offers.
     *
     * For each offer, as many complete sets as the cart contains are counted, and the discount
     * per set is what the components cost *at the prices checkout is already using* minus the
     * bundle price. Two consequences worth stating:
     *
     * <ul>
     *   <li>Using the effective price (not the list price) means an offer never stacks on top of
     *       a quantity discount that already beat it - the saving clamps at zero instead of
     *       being applied twice.</li>
     *   <li>Units are <em>consumed</em>: a product appearing in two offers is counted for one of
     *       them, richest first. Otherwise overlapping offers would each discount the same
     *       units and the basket could fall below cost.</li>
     * </ul>
     */
    @Transactional(readOnly = true)
    public BundleDiscount computeDiscount(List<CartLine> lines) {
        if (lines == null || lines.isEmpty()) {
            return BundleDiscount.none();
        }
        List<Bundle> available = bundleRepository.findAvailable(Instant.now());
        if (available.isEmpty()) {
            return BundleDiscount.none();
        }

        Map<UUID, Integer> remaining = new HashMap<>();
        Map<UUID, BigDecimal> unitPrice = new HashMap<>();
        for (CartLine line : lines) {
            remaining.merge(line.productId(), line.quantity(), Integer::sum);
            unitPrice.put(line.productId(), line.effectiveUnitPrice());
        }

        // Richest offer first, so overlapping offers resolve in the customer's favour.
        List<Bundle> ordered = new ArrayList<>(available);
        ordered.sort((a, b) -> discountPerSet(b, unitPrice).compareTo(discountPerSet(a, unitPrice)));

        BigDecimal total = BigDecimal.ZERO;
        List<AppliedBundle> applied = new ArrayList<>();

        for (Bundle bundle : ordered) {
            BigDecimal perSet = discountPerSet(bundle, unitPrice);
            if (perSet.signum() <= 0) {
                continue;
            }
            int sets = completeSets(bundle, remaining);
            if (sets <= 0) {
                continue;
            }
            bundle.getItems().forEach(item ->
                    remaining.computeIfPresent(item.getProduct().getId(),
                            (id, left) -> left - item.getQuantity() * sets));

            BigDecimal discount = perSet.multiply(BigDecimal.valueOf(sets));
            total = total.add(discount);
            applied.add(new AppliedBundle(bundle.getId(), bundle.getName(), sets, discount));
        }
        return new BundleDiscount(total.setScale(2, RoundingMode.HALF_UP), applied);
    }

    /** How many complete copies of the set the remaining quantities can still cover. */
    private int completeSets(Bundle bundle, Map<UUID, Integer> remaining) {
        int sets = Integer.MAX_VALUE;
        for (BundleItem item : bundle.getItems()) {
            int have = remaining.getOrDefault(item.getProduct().getId(), 0);
            sets = Math.min(sets, have / item.getQuantity());
            if (sets == 0) {
                return 0;
            }
        }
        return sets == Integer.MAX_VALUE ? 0 : sets;
    }

    /**
     * What one set saves, at the prices already in play. A product absent from the cart falls
     * back to its list price, which only matters when the caller is pricing a hypothetical set.
     */
    private BigDecimal discountPerSet(Bundle bundle, Map<UUID, BigDecimal> unitPrice) {
        BigDecimal components = BigDecimal.ZERO;
        for (BundleItem item : bundle.getItems()) {
            BigDecimal price = unitPrice.getOrDefault(item.getProduct().getId(),
                    item.getProduct().getPrice());
            components = components.add(price.multiply(BigDecimal.valueOf(item.getQuantity())));
        }
        BigDecimal saving = components.subtract(bundle.getPrice());
        // Never negative: an offer priced above its parts must not *raise* the bill.
        return saving.signum() > 0 ? saving : BigDecimal.ZERO;
    }

    // ---- Helpers -----------------------------------------------------------------------

    private Bundle withItems(UUID id) {
        return bundleRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResourceNotFoundException("Offre", id));
    }

    /** Replace the component list, rejecting duplicates and unknown products. */
    private void applyItems(Bundle bundle, List<BundleItemRequest> requested) {
        Map<UUID, Integer> merged = new LinkedHashMap<>();
        for (BundleItemRequest item : requested) {
            if (merged.putIfAbsent(item.productId(), item.quantity()) != null) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Un produit ne peut apparaître qu'une fois dans une offre : "
                                + "utilisez la quantité.");
            }
        }
        bundle.getItems().clear();
        merged.forEach((productId, quantity) -> {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Produit", productId));
            bundle.getItems().add(BundleItem.builder()
                    .bundle(bundle).product(product).quantity(quantity).build());
        });
    }

    /** An offer that saves nothing is a pricing mistake - refuse it at the door. */
    private void validatePrice(Bundle bundle) {
        BigDecimal components = bundle.getItems().stream()
                .map(i -> i.getProduct().getPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (bundle.getPrice().compareTo(components) >= 0) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, String.format(Locale.FRANCE,
                    "Le prix de l'offre (%.2f) doit être inférieur au total des produits (%.2f).",
                    bundle.getPrice(), components));
        }
    }

    private String uniqueSlug(String name, UUID selfId) {
        String base = slugify(name);
        String candidate = base;
        int suffix = 2;
        while (bundleRepository.findBySlug(candidate)
                .filter(existing -> selfId == null || !existing.getId().equals(selfId))
                .isPresent()) {
            candidate = base + "-" + suffix++;
            if (suffix > 100) {
                throw new ConflictException("Impossible de générer un identifiant pour cette offre.");
            }
        }
        return candidate;
    }

    /** "Panier Ramadan" -> "panier-ramadan". Accents are folded, not dropped. */
    private String slugify(String value) {
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return normalized.isBlank() ? "offre" : normalized;
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    /**
     * A bundle as the shopper looking at it sees it.
     *
     * Every figure is resolved against their segment, or withheld entirely when they have none.
     * An anonymous visitor still sees the offer exists and what is in it - that is what brings
     * them to register - but not a single price.
     */
    private BundleResponse toResponse(Bundle bundle) {
        return render(bundle, catalogueViewer.currentClientTypeId().orElse(null), null);
    }

    /**
     * A bundle as the back-office sees it: priced for the trade it is actually sold to.
     *
     * An operator has no segment of their own, so resolving against the viewer left every
     * amount null and the admin table printed 0,00 DH next to a bundle that was correctly
     * priced. The bundle's own segment is the only one that means anything here - a basket
     * belongs to one trade - so that is what is resolved, and it is named alongside.
     *
     * A bundle carrying prices for several segments is a leftover from before that rule; the
     * cheapest is shown rather than picking arbitrarily.
     */
    private BundleResponse toAdminResponse(Bundle bundle) {
        return bundlePriceRepository.findByBundleId(bundle.getId()).stream()
                .min(java.util.Comparator.comparing(BundleTypePrice::getPrice))
                .map(row -> render(bundle, row.getClientType().getId(), row.getClientType().getName()))
                .orElseGet(() -> render(bundle, null, null));
    }

    private BundleResponse render(Bundle bundle, UUID clientTypeId, String clientTypeName) {
        List<BundleItemResponse> items = new ArrayList<>();
        BigDecimal componentsTotal = clientTypeId == null ? null : BigDecimal.ZERO;
        boolean available = !bundle.getItems().isEmpty();

        Map<UUID, List<ProductTypePrice>> ladders = clientTypeId == null
                ? Map.of()
                : productPriceRepository.findForProductsAndType(
                                bundle.getItems().stream().map(i -> i.getProduct().getId()).toList(),
                                clientTypeId)
                        .stream()
                        .collect(Collectors.groupingBy(r -> r.getProduct().getId()));

        for (BundleItem item : bundle.getItems()) {
            Product product = item.getProduct();
            boolean inStock = product.isActive() && product.getStockQuantity() >= item.getQuantity();
            available = available && inStock;

            BigDecimal unit = null;
            BigDecimal lineTotal = null;
            if (clientTypeId != null) {
                unit = pricingService.resolveTypeUnitPrice(
                        ladders.get(product.getId()), item.getQuantity()).orElse(null);
                if (unit == null) {
                    // A component this segment cannot buy makes the whole set unbuyable, and
                    // any total we printed would be fiction.
                    componentsTotal = null;
                    available = false;
                } else {
                    lineTotal = pricingService.lineTotal(unit, item.getQuantity());
                    if (componentsTotal != null) {
                        componentsTotal = componentsTotal.add(lineTotal);
                    }
                }
            }

            items.add(new BundleItemResponse(product.getId(), product.getName(), product.getSlug(),
                    product.getUnit(), product.getImageUrl(), item.getQuantity(),
                    unit, lineTotal, product.getStockQuantity(), inStock));
        }

        BigDecimal price = clientTypeId == null ? null
                : bundlePriceRepository.findByBundleIdAndClientTypeId(bundle.getId(), clientTypeId)
                        .map(BundleTypePrice::getPrice).orElse(null);
        if (clientTypeId != null && price == null) {
            // Not priced for this segment: the offer is not on sale to them.
            available = false;
        }

        BigDecimal savings = BigDecimal.ZERO;
        if (price != null && componentsTotal != null) {
            savings = componentsTotal.subtract(price).max(BigDecimal.ZERO);
        }
        int savingsPercent = componentsTotal != null && componentsTotal.signum() > 0
                ? savings.multiply(BigDecimal.valueOf(100))
                        .divide(componentsTotal, 0, RoundingMode.HALF_UP).intValue()
                : 0;

        return new BundleResponse(bundle.getId(), bundle.getName(), bundle.getNameAr(),
                bundle.getSlug(), bundle.getDescription(), bundle.getDescriptionAr(),
                bundle.getImageUrl(), clientTypeName, price,
                componentsTotal, savings, savingsPercent, bundle.isActive(),
                available && bundle.isAvailableAt(Instant.now()),
                bundle.getStartsAt(), bundle.getEndsAt(), items, bundle.getCreatedAt());
    }
}
