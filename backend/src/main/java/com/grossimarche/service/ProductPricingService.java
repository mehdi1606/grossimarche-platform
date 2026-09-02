package com.grossimarche.service;

import com.grossimarche.config.CacheConfig;
import com.grossimarche.dto.pricing.PriceGridRequest;
import com.grossimarche.dto.pricing.PriceGridResponse;
import com.grossimarche.entity.ClientType;
import com.grossimarche.entity.Product;
import com.grossimarche.entity.ProductTypePrice;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ErrorCode;
import com.grossimarche.exception.ResourceNotFoundException;
import com.grossimarche.repository.ClientTypeRepository;
import com.grossimarche.repository.ProductRepository;
import com.grossimarche.repository.ProductTypePriceRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Reading and writing what each segment pays for a product.
 *
 * The grid is edited as a whole rather than rung by rung: a price ladder is only coherent read
 * together, and half-applied edits are how a product ends up costing more at ten units than at
 * three.
 */
@Service
public class ProductPricingService {

    private final ProductTypePriceRepository priceRepository;
    private final ProductRepository productRepository;
    private final ClientTypeRepository clientTypeRepository;

    public ProductPricingService(ProductTypePriceRepository priceRepository,
                                 ProductRepository productRepository,
                                 ClientTypeRepository clientTypeRepository) {
        this.priceRepository = priceRepository;
        this.productRepository = productRepository;
        this.clientTypeRepository = clientTypeRepository;
    }

    /**
     * The grid the back-office edits: every active segment, priced or not.
     *
     * Retired segments appear too when they still carry prices - hiding them would make a
     * product silently unbuyable for the customers still attached to one.
     */
    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional(readOnly = true)
    public PriceGridResponse getGrid(UUID productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Produit", productId));

        Map<UUID, List<ProductTypePrice>> byType =
                priceRepository.findByProductIdOrderByClientTypeIdAscMinQuantityAsc(productId)
                        .stream()
                        .collect(Collectors.groupingBy(p -> p.getClientType().getId()));

        List<ClientType> types = new ArrayList<>(
                clientTypeRepository.findAllByActiveTrueOrderBySortOrderAscNameAsc());
        // A retired segment that still has prices has to stay visible, or the admin loses the
        // only view of what its customers are still being charged.
        Set<UUID> shown = types.stream().map(ClientType::getId).collect(Collectors.toSet());
        byType.keySet().stream()
                .filter(id -> !shown.contains(id))
                .map(clientTypeRepository::findById)
                .flatMap(java.util.Optional::stream)
                .forEach(types::add);

        List<PriceGridResponse.TypeGrid> grids = types.stream()
                .map(type -> new PriceGridResponse.TypeGrid(
                        type.getId(),
                        type.getName(),
                        type.isActive(),
                        byType.getOrDefault(type.getId(), List.of()).stream()
                                .sorted(Comparator.comparingInt(ProductTypePrice::getMinQuantity))
                                .map(p -> new PriceGridResponse.Rung(p.getMinQuantity(), p.getUnitPrice()))
                                .toList()))
                .toList();

        return new PriceGridResponse(product.getId(), product.getName(), product.getPrice(), grids);
    }

    /**
     * Replace a product's whole grid.
     *
     * Both caches are cleared because a price decides *visibility*, not just a figure: pricing
     * the first product of a category makes that whole category appear for the segment, and
     * removing the last one makes it vanish. Left cached, an admin would price a product and
     * see nothing change in the shop.
     */
    @CacheEvict(value = {CacheConfig.CATEGORIES, CacheConfig.PRODUCT_DETAIL}, allEntries = true)
    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional
    public PriceGridResponse replaceGrid(UUID productId, PriceGridRequest req) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Produit", productId));

        List<PriceGridRequest.TypeGrid> grids =
                req.grids() == null ? List.of() : req.grids();

        Map<UUID, ClientType> types = clientTypeRepository.findAllById(
                        grids.stream().map(PriceGridRequest.TypeGrid::clientTypeId).toList())
                .stream()
                .collect(Collectors.toMap(ClientType::getId, Function.identity()));

        List<ProductTypePrice> rows = new ArrayList<>();
        Set<UUID> seenTypes = new HashSet<>();
        for (PriceGridRequest.TypeGrid grid : grids) {
            ClientType type = types.get(grid.clientTypeId());
            if (type == null) {
                throw new ResourceNotFoundException("Type de client", grid.clientTypeId());
            }
            if (!seenTypes.add(type.getId())) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Le type « " + type.getName() + " » apparaît deux fois dans la grille.");
            }
            for (ProductTypePrice row : validatedLadder(product, type, grid.rungs())) {
                rows.add(row);
            }
        }

        // Replace rather than merge: the form submitted the whole grid, so anything not in it
        // was deleted by the admin.
        priceRepository.deleteByProductId(productId);
        priceRepository.flush();
        priceRepository.saveAll(rows);

        return getGrid(productId);
    }

    /**
     * Turn one segment's submitted rungs into rows, refusing a ladder that cannot be right.
     *
     * The unit price must not rise as the quantity grows. A ladder that goes up is always a
     * typo, and an expensive one: it charges more for buying more, which is the opposite of
     * every quantity break the shop advertises.
     */
    private List<ProductTypePrice> validatedLadder(Product product, ClientType type,
                                                   List<PriceGridRequest.Rung> rungs) {
        if (rungs == null || rungs.isEmpty()) {
            return List.of();
        }
        List<PriceGridRequest.Rung> ordered = rungs.stream()
                .sorted(Comparator.comparingInt(PriceGridRequest.Rung::minQuantity))
                .toList();

        Integer previousQty = null;
        BigDecimal previousPrice = null;
        List<ProductTypePrice> rows = new ArrayList<>(ordered.size());
        for (PriceGridRequest.Rung rung : ordered) {
            if (previousQty != null && previousQty.equals(rung.minQuantity())) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Deux prix sont définis pour la même quantité (" + rung.minQuantity()
                                + ") dans « " + type.getName() + " ».");
            }
            if (previousPrice != null && rung.unitPrice().compareTo(previousPrice) > 0) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Dans « " + type.getName() + " », le prix augmente à partir de "
                                + rung.minQuantity() + " unités. Un palier de quantité doit "
                                + "baisser le prix, jamais l'augmenter.");
            }
            rows.add(ProductTypePrice.builder()
                    .product(product)
                    .clientType(type)
                    .minQuantity(rung.minQuantity())
                    .unitPrice(rung.unitPrice())
                    .build());
            previousQty = rung.minQuantity();
            previousPrice = rung.unitPrice();
        }
        return rows;
    }
}
