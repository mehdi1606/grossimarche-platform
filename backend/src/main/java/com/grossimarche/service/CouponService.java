package com.grossimarche.service;

import com.grossimarche.dto.coupon.AdminCouponRequest;
import com.grossimarche.dto.coupon.AdminCouponResponse;
import com.grossimarche.dto.coupon.CouponPreviewResponse;
import com.grossimarche.dto.mapper.CouponMapper;
import com.grossimarche.entity.Coupon;
import com.grossimarche.entity.CouponRedemption;
import com.grossimarche.entity.Order;
import com.grossimarche.exception.ConflictException;
import com.grossimarche.exception.ErrorCode;
import com.grossimarche.exception.ResourceNotFoundException;
import com.grossimarche.repository.CouponRedemptionRepository;
import com.grossimarche.repository.CouponRepository;
import com.grossimarche.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Coupon rules and admin CRUD. Money is computed in {@link PricingService}; this service
 * owns validity (active, window, minimum, usage/per-user limits) and redemption records.
 * {@link #evaluate} is pure — it never throws — so both the preview endpoint and checkout
 * share one code path; the caller decides whether an invalid result is a 200 or an error.
 */
@Service
public class CouponService {

    private final CouponRepository couponRepository;
    private final CouponRedemptionRepository redemptionRepository;
    private final CartService cartService;
    private final PricingService pricingService;
    private final CouponMapper couponMapper;
    private final UserRepository userRepository;

    public CouponService(CouponRepository couponRepository,
                         CouponRedemptionRepository redemptionRepository, CartService cartService,
                         PricingService pricingService, CouponMapper couponMapper,
                         UserRepository userRepository) {
        this.couponRepository = couponRepository;
        this.redemptionRepository = redemptionRepository;
        this.cartService = cartService;
        this.pricingService = pricingService;
        this.couponMapper = couponMapper;
        this.userRepository = userRepository;
    }

    // ---- Validation shared by preview + checkout --------------------------------------

    /** A coupon check result. {@code valid} true ⇒ {@code coupon}/{@code discount} set. */
    public record Evaluation(boolean valid, Coupon coupon, BigDecimal discount,
                             ErrorCode errorCode, String message) {

        static Evaluation ok(Coupon coupon, BigDecimal discount) {
            return new Evaluation(true, coupon, discount, null, "Code promo appliqué.");
        }

        static Evaluation fail(ErrorCode code, String message) {
            return new Evaluation(false, null, BigDecimal.ZERO, code, message);
        }
    }

    /** Validate a code for a user against a goods subtotal, and compute the discount. */
    @Transactional(readOnly = true)
    public Evaluation evaluate(UUID userId, String code, BigDecimal subtotal) {
        if (code == null || code.isBlank()) {
            return Evaluation.fail(ErrorCode.COUPON_INVALID, "Code promo invalide.");
        }
        Coupon coupon = couponRepository.findByCodeIgnoreCase(code.trim()).orElse(null);
        if (coupon == null || !coupon.isActive()) {
            return Evaluation.fail(ErrorCode.COUPON_INVALID, "Code promo invalide.");
        }
        Instant now = Instant.now();
        if (coupon.getStartsAt() != null && now.isBefore(coupon.getStartsAt())) {
            return Evaluation.fail(ErrorCode.COUPON_INVALID, "Ce code promo n'est pas encore actif.");
        }
        if (coupon.getExpiresAt() != null && now.isAfter(coupon.getExpiresAt())) {
            return Evaluation.fail(ErrorCode.COUPON_EXPIRED, "Ce code promo a expiré.");
        }
        if (subtotal.compareTo(coupon.getMinOrderSubtotal()) < 0) {
            return Evaluation.fail(ErrorCode.COUPON_NOT_APPLICABLE,
                    "Minimum de " + coupon.getMinOrderSubtotal().stripTrailingZeros().toPlainString()
                            + " MAD requis pour ce code.");
        }
        if (coupon.getUsageLimit() != null
                && redemptionRepository.countByCouponId(coupon.getId()) >= coupon.getUsageLimit()) {
            return Evaluation.fail(ErrorCode.COUPON_USAGE_EXCEEDED,
                    "Ce code promo a atteint sa limite d'utilisation.");
        }
        if (redemptionRepository.countByCouponIdAndUserId(coupon.getId(), userId) >= coupon.getPerUserLimit()) {
            return Evaluation.fail(ErrorCode.COUPON_USAGE_EXCEEDED, "Vous avez déjà utilisé ce code promo.");
        }
        BigDecimal discount = pricingService.couponDiscount(coupon.getType(), coupon.getValue(),
                coupon.getMaxDiscount(), subtotal);
        if (discount.signum() <= 0) {
            return Evaluation.fail(ErrorCode.COUPON_NOT_APPLICABLE,
                    "Ce code promo ne s'applique pas à votre panier.");
        }
        return Evaluation.ok(coupon, discount);
    }

    /** Preview a code against the caller's current cart (200 even when invalid). */
    @Transactional(readOnly = true)
    public CouponPreviewResponse preview(UUID userId, String code) {
        BigDecimal subtotal = cartService.getCart(userId).subtotal();
        Evaluation ev = evaluate(userId, code, subtotal);
        if (!ev.valid()) {
            return new CouponPreviewResponse(code, null, BigDecimal.ZERO, subtotal, subtotal,
                    false, ev.message());
        }
        return new CouponPreviewResponse(ev.coupon().getCode(), ev.coupon().getType(), ev.discount(),
                subtotal, pricingService.money(subtotal.subtract(ev.discount())), true, ev.message());
    }

    /** Record a redemption in the checkout transaction (called by CheckoutService). */
    public void recordRedemption(Coupon coupon, UUID userId, Order order, BigDecimal discount) {
        redemptionRepository.save(CouponRedemption.builder()
                .coupon(coupon)
                .user(userRepository.getReferenceById(userId))
                .order(order)
                .discountAmount(discount)
                .build());
    }

    // ---- Admin CRUD -------------------------------------------------------------------

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public Page<AdminCouponResponse> list(Pageable pageable) {
        return couponRepository.findAll(pageable)
                .map(c -> couponMapper.toAdmin(c, redemptionRepository.countByCouponId(c.getId())));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public AdminCouponResponse create(AdminCouponRequest req) {
        String code = req.code().trim().toUpperCase();
        if (couponRepository.existsByCodeIgnoreCase(code)) {
            throw new ConflictException("Un code promo identique existe déjà.");
        }
        Coupon coupon = couponRepository.save(apply(new Coupon(), req, code));
        return couponMapper.toAdmin(coupon, 0);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public AdminCouponResponse update(UUID id, AdminCouponRequest req) {
        Coupon coupon = getById(id);
        String code = req.code().trim().toUpperCase();
        couponRepository.findByCodeIgnoreCase(code)
                .filter(other -> !other.getId().equals(id))
                .ifPresent(other -> {
                    throw new ConflictException("Un code promo identique existe déjà.");
                });
        apply(coupon, req, code);
        return couponMapper.toAdmin(coupon, redemptionRepository.countByCouponId(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void deactivate(UUID id) {
        getById(id).setActive(false);
    }

    private Coupon apply(Coupon coupon, AdminCouponRequest req, String code) {
        coupon.setCode(code);
        coupon.setType(req.type());
        coupon.setValue(req.value());
        coupon.setMinOrderSubtotal(req.minOrderSubtotal());
        coupon.setMaxDiscount(req.maxDiscount());
        coupon.setStartsAt(req.startsAt());
        coupon.setExpiresAt(req.expiresAt());
        coupon.setUsageLimit(req.usageLimit());
        coupon.setPerUserLimit(req.perUserLimit());
        coupon.setActive(req.active());
        return coupon;
    }

    private Coupon getById(UUID id) {
        return couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Code promo", id));
    }
}
