package com.grossimarche.service;

import com.grossimarche.dto.pricing.BundlePriceGridRequest;
import com.grossimarche.dto.pricing.BundlePriceGridResponse;
import com.grossimarche.entity.Bundle;
import com.grossimarche.entity.BundleItem;
import com.grossimarche.entity.BundleTypePrice;
import com.grossimarche.entity.ClientType;
import com.grossimarche.entity.ProductTypePrice;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ErrorCode;
import com.grossimarche.exception.ResourceNotFoundException;
import com.grossimarche.repository.BundleRepository;
import com.grossimarche.repository.BundleTypePriceRepository;
import com.grossimarche.repository.ClientTypeRepository;
import com.grossimarche.repository.ProductTypePriceRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * What a bundle costs each segment.
 *
 * A bundle can only be offered to a segment that has a price for every one of its components:
 * without them there is nothing to discount against, no saving to display, and nothing for
 * checkout to match a cart against.
 */
@Service
public class BundlePricingService {

    private final BundleTypePriceRepository bundlePriceRepository;
    private final ProductTypePriceRepository productPriceRepository;
    private final BundleRepository bundleRepository;
    private final ClientTypeRepository clientTypeRepository;
    private final PricingService pricingService;

    public BundlePricingService(BundleTypePriceRepository bundlePriceRepository,
                                ProductTypePriceRepository productPriceRepository,
                                BundleRepository bundleRepository,
                                ClientTypeRepository clientTypeRepository,
                                PricingService pricingService) {
        this.bundlePriceRepository = bundlePriceRepository;
        this.productPriceRepository = productPriceRepository;
        this.bundleRepository = bundleRepository;
        this.clientTypeRepository = clientTypeRepository;
        this.pricingService = pricingService;
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional(readOnly = true)
    public BundlePriceGridResponse getGrid(UUID bundleId) {
        Bundle bundle = bundleRepository.findByIdWithItems(bundleId)
                .orElseThrow(() -> new ResourceNotFoundException("Offre", bundleId));

        Map<UUID, BigDecimal> priced = bundlePriceRepository.findByBundleId(bundleId).stream()
                .collect(Collectors.toMap(p -> p.getClientType().getId(), BundleTypePrice::getPrice));

        List<ClientType> types = new ArrayList<>(
                clientTypeRepository.findAllByActiveTrueOrderBySortOrderAscNameAsc());
        Set<UUID> shown = types.stream().map(ClientType::getId).collect(Collectors.toSet());
        priced.keySet().stream()
                .filter(id -> !shown.contains(id))
                .map(clientTypeRepository::findById)
                .flatMap(Optional::stream)
                .forEach(types::add);

        List<BundlePriceGridResponse.TypePrice> rows = types.stream()
                .map(type -> {
                    ComponentCost cost = componentCost(bundle, type.getId());
                    return new BundlePriceGridResponse.TypePrice(
                            type.getId(), type.getName(), type.isActive(),
                            priced.get(type.getId()), cost.total(), cost.missing());
                })
                .toList();

        return new BundlePriceGridResponse(bundle.getId(), bundle.getName(), rows);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional
    public BundlePriceGridResponse replaceGrid(UUID bundleId, BundlePriceGridRequest req) {
        Bundle bundle = bundleRepository.findByIdWithItems(bundleId)
                .orElseThrow(() -> new ResourceNotFoundException("Offre", bundleId));

        List<BundlePriceGridRequest.TypePrice> submitted =
                req.prices() == null ? List.of() : req.prices();

        Map<UUID, ClientType> types = clientTypeRepository.findAllById(
                        submitted.stream().map(BundlePriceGridRequest.TypePrice::clientTypeId).toList())
                .stream()
                .collect(Collectors.toMap(ClientType::getId, Function.identity()));

        List<BundleTypePrice> rows = new ArrayList<>();
        Set<UUID> seen = new HashSet<>();
        for (BundlePriceGridRequest.TypePrice entry : submitted) {
            ClientType type = types.get(entry.clientTypeId());
            if (type == null) {
                throw new ResourceNotFoundException("Type de client", entry.clientTypeId());
            }
            if (!seen.add(type.getId())) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Le type « " + type.getName() + " » apparaît deux fois.");
            }

            ComponentCost cost = componentCost(bundle, type.getId());
            if (cost.total() == null) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Impossible de fixer un prix pour « " + type.getName()
                                + " » : ces produits du panier n'ont pas de prix pour ce type : "
                                + String.join(", ", cost.missing()) + ".");
            }
            if (entry.price().compareTo(cost.total()) >= 0) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Pour « " + type.getName() + " », le prix du panier ("
                                + entry.price() + ") doit être inférieur au total des produits ("
                                + cost.total() + "). Un panier qui ne fait rien économiser "
                                + "n'est pas une offre.");
            }

            rows.add(BundleTypePrice.builder()
                    .bundle(bundle)
                    .clientType(type)
                    .price(entry.price())
                    .build());
        }

        bundlePriceRepository.deleteByBundleId(bundleId);
        bundlePriceRepository.flush();
        bundlePriceRepository.saveAll(rows);

        return getGrid(bundleId);
    }

    /**
     * What a bundle's components come to in one segment, at the bundle's own quantities.
     *
     * Each component is priced at the rung its bundle quantity earns - buying three in a basket
     * gets the three-unit rate, exactly as buying three loose would. Returns a null total when
     * any component has no price in this segment, naming the culprits: a partial total would
     * suggest a saving that cannot be honoured.
     */
    private ComponentCost componentCost(Bundle bundle, UUID clientTypeId) {
        List<BundleItem> items = bundle.getItems();
        if (items == null || items.isEmpty()) {
            return new ComponentCost(null, List.of());
        }

        List<UUID> productIds = items.stream().map(i -> i.getProduct().getId()).toList();
        Map<UUID, List<ProductTypePrice>> ladders =
                productPriceRepository.findForProductsAndType(productIds, clientTypeId).stream()
                        .collect(Collectors.groupingBy(p -> p.getProduct().getId(),
                                HashMap::new, Collectors.toList()));

        BigDecimal total = BigDecimal.ZERO;
        List<String> missing = new ArrayList<>();
        for (BundleItem item : items) {
            Optional<BigDecimal> unit = pricingService.resolveTypeUnitPrice(
                    ladders.get(item.getProduct().getId()), item.getQuantity());
            if (unit.isEmpty()) {
                missing.add(item.getProduct().getName());
                continue;
            }
            total = total.add(pricingService.lineTotal(unit.get(), item.getQuantity()));
        }

        return missing.isEmpty()
                ? new ComponentCost(pricingService.money(total), List.of())
                : new ComponentCost(null, missing);
    }

    private record ComponentCost(BigDecimal total, List<String> missing) {
    }
}
