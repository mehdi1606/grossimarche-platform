package com.grossimarche.service;

import com.grossimarche.dto.cart.CartItemResponse;
import com.grossimarche.dto.cart.CartResponse;
import com.grossimarche.dto.cart.GuestCartItem;
import com.grossimarche.entity.Cart;
import com.grossimarche.entity.CartItem;
import com.grossimarche.entity.Product;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ErrorCode;
import com.grossimarche.exception.InsufficientStockException;
import com.grossimarche.exception.ResourceNotFoundException;
import com.grossimarche.repository.CartItemRepository;
import com.grossimarche.repository.CartRepository;
import com.grossimarche.repository.ProductRepository;
import com.grossimarche.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * One persistent cart per user. All line pricing and totals come from
 * {@link PricingService}; quantities are validated against min-order and live stock.
 */
@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final SegmentPricingService segmentPricing;
    private final PricingService pricingService;
    private final UserRepository userRepository;

    public CartService(CartRepository cartRepository, CartItemRepository cartItemRepository,
                       ProductRepository productRepository,
                       SegmentPricingService segmentPricing,
                       PricingService pricingService, UserRepository userRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.segmentPricing = segmentPricing;
        this.pricingService = pricingService;
        this.userRepository = userRepository;
    }

    @Transactional
    public CartResponse getCart(UUID userId) {
        Cart cart = getOrCreateCart(userId);
        return toResponse(userId, cartItemRepository.findByCartId(cart.getId()));
    }

    @Transactional
    public CartResponse setItemQuantity(UUID userId, UUID productId, int quantity) {
        Cart cart = getOrCreateCart(userId);
        Product product = productRepository.findByIdAndActiveTrue(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Produit", productId));

        CartItem existing = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId).orElse(null);
        if (quantity == 0) {
            if (existing != null) {
                cartItemRepository.delete(existing);
            }
        } else {
            validateQuantity(product, quantity);
            if (existing == null) {
                cartItemRepository.save(CartItem.builder().cart(cart).product(product)
                        .quantity(quantity).build());
            } else {
                existing.setQuantity(quantity);
            }
        }
        cart.setUpdatedAt(java.time.Instant.now());
        return toResponse(userId, cartItemRepository.findByCartId(cart.getId()));
    }

    @Transactional
    public void clear(UUID userId) {
        Cart cart = getOrCreateCart(userId);
        cartItemRepository.deleteByCartId(cart.getId());
    }

    @Transactional
    public CartResponse mergeGuestCart(UUID userId, List<GuestCartItem> guestItems) {
        Cart cart = getOrCreateCart(userId);
        for (GuestCartItem g : guestItems) {
            Product product = productRepository.findByIdAndActiveTrue(g.productId()).orElse(null);
            if (product == null) {
                continue; // silently skip products that no longer exist
            }
            CartItem existing = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId())
                    .orElse(null);
            int merged = (existing == null ? 0 : existing.getQuantity()) + g.quantity();
            merged = Math.min(merged, product.getStockQuantity());
            merged = Math.max(merged, product.getMinOrderQuantity());
            if (existing == null) {
                cartItemRepository.save(CartItem.builder().cart(cart).product(product).quantity(merged).build());
            } else {
                existing.setQuantity(merged);
            }
        }
        cart.setUpdatedAt(java.time.Instant.now());
        return toResponse(userId, cartItemRepository.findByCartId(cart.getId()));
    }

    private void validateQuantity(Product product, int quantity) {
        if (quantity < product.getMinOrderQuantity()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Quantité minimale de commande : " + product.getMinOrderQuantity() + ".");
        }
        if (quantity > product.getStockQuantity()) {
            throw new InsufficientStockException(
                    "Stock insuffisant : " + product.getStockQuantity() + " disponible(s).");
        }
    }

    private Cart getOrCreateCart(UUID userId) {
        return cartRepository.findByUserId(userId).orElseGet(() ->
                cartRepository.save(Cart.builder()
                        .user(userRepository.getReferenceById(userId))
                        .updatedAt(java.time.Instant.now())
                        .build()));
    }

    /**
     * Price the cart for its owner's segment.
     *
     * The same resolution checkout performs, so the basket a shopper reads and the invoice they
     * receive cannot disagree - the classic way that happens is two code paths pricing the same
     * line from two different tables.
     */
    private CartResponse toResponse(UUID userId, List<CartItem> items) {
        UUID clientTypeId = segmentPricing.requireClientTypeId(
                userRepository.findById(userId).orElseThrow(() ->
                        new ResourceNotFoundException("Client", userId)));
        List<CartItemResponse> lines = new ArrayList<>();
        List<PricingService.LinePricing> pricingLines = new ArrayList<>();
        for (CartItem item : items) {
            Product product = item.getProduct();
            SegmentPricingService.LinePrice priced =
                    segmentPricing.priceLine(clientTypeId, product, item.getQuantity());
            BigDecimal base = priced.entryPrice();
            BigDecimal effective = priced.unitPrice();
            BigDecimal lineTotal = pricingService.lineTotal(effective, item.getQuantity());
            boolean stockIssue = item.getQuantity() > product.getStockQuantity();
            lines.add(new CartItemResponse(product.getId(), product.getName(), product.getUnit(),
                    product.getImageUrl(), item.getQuantity(), pricingService.money(base), effective,
                    lineTotal, product.getStockQuantity(), false, stockIssue));
            pricingLines.add(new PricingService.LinePricing(base, effective, item.getQuantity()));
        }
        PricingService.Totals totals = pricingService.computeTotals(pricingLines);
        return new CartResponse(lines, totals.subtotal(), totals.discountTotal(),
                totals.deliveryFee(), totals.total());
    }
}
