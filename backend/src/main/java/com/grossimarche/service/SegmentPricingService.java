package com.grossimarche.service;

import com.grossimarche.entity.Product;
import com.grossimarche.entity.ProductTypePrice;
import com.grossimarche.entity.User;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ErrorCode;
import com.grossimarche.repository.ProductTypePriceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * What a given customer pays for a given product at a given quantity.
 *
 * The one place cart and checkout resolve money, so the price a shopper is shown and the price
 * they are charged cannot drift apart. It refuses rather than guesses: no ladder for the
 * segment, or a quantity below the smallest rung, is an error and not a fallback to some other
 * price - a cart that silently reverts to the list price bills the wrong amount and nobody
 * notices until the invoice.
 */
@Service
public class SegmentPricingService {

    private final ProductTypePriceRepository priceRepository;
    private final PricingService pricingService;

    public SegmentPricingService(ProductTypePriceRepository priceRepository,
                                 PricingService pricingService) {
        this.priceRepository = priceRepository;
        this.pricingService = pricingService;
    }

    /** The segment a buyer trades under, refusing anyone who has none. */
    public UUID requireClientTypeId(User user) {
        if (user.getClientType() == null) {
            throw new BusinessException(ErrorCode.FORBIDDEN,
                    "Votre compte n'a pas de catégorie tarifaire. Contactez-nous.");
        }
        return user.getClientType().getId();
    }

    /**
     * The unit price and the segment's entry price for one line.
     *
     * The entry price is carried alongside so the saving can be shown as what this customer
     * actually saves by buying in quantity - measured against their own base price, not against
     * a list price they never pay.
     */
    @Transactional(readOnly = true)
    public LinePrice priceLine(UUID clientTypeId, Product product, int quantity) {
        List<ProductTypePrice> ladder = priceRepository
                .findByProductIdAndClientTypeIdOrderByMinQuantityAsc(product.getId(), clientTypeId);

        if (ladder.isEmpty()) {
            throw new BusinessException(ErrorCode.PRICE_CHANGED,
                    "« " + product.getName() + " » n'est plus disponible pour votre catégorie.");
        }

        int minimum = pricingService.minimumQuantity(ladder);
        if (quantity < minimum) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "« " + product.getName() + " » se commande à partir de " + minimum
                            + " unité(s).");
        }

        BigDecimal effective = pricingService.resolveTypeUnitPrice(ladder, quantity)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRICE_CHANGED,
                        "Prix indisponible pour « " + product.getName() + " »."));
        BigDecimal entry = pricingService.resolveTypeUnitPrice(ladder, minimum).orElse(effective);

        return new LinePrice(entry, effective, minimum);
    }

    /**
     * @param entryPrice    what one unit costs at the smallest quantity this segment may buy
     * @param unitPrice     what one unit costs at the requested quantity
     * @param minimumQuantity the smallest quantity this segment may buy
     */
    public record LinePrice(BigDecimal entryPrice, BigDecimal unitPrice, int minimumQuantity) {
    }
}
