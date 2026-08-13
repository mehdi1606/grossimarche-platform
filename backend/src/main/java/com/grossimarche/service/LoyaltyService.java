package com.grossimarche.service;

import com.grossimarche.config.LoyaltyProperties;
import com.grossimarche.dto.loyalty.LoyaltyResponse;
import com.grossimarche.dto.loyalty.LoyaltyTransactionResponse;
import com.grossimarche.entity.LoyaltyAccount;
import com.grossimarche.entity.LoyaltyTransaction;
import com.grossimarche.entity.User;
import com.grossimarche.entity.enums.LoyaltyTier;
import com.grossimarche.entity.enums.LoyaltyTransactionType;
import com.grossimarche.exception.ResourceNotFoundException;
import com.grossimarche.repository.LoyaltyAccountRepository;
import com.grossimarche.repository.LoyaltyTransactionRepository;
import com.grossimarche.repository.OrderRepository;
import com.grossimarche.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

/**
 * Loyalty ledger. Core invariant: an account's {@code pointsBalance} always equals the sum
 * of its transactions. Every balance change writes exactly one ledger row, so the two can
 * never drift. Earn rate, tier thresholds and multipliers come from {@link LoyaltyProperties}.
 */
@Service
public class LoyaltyService {

    private final LoyaltyAccountRepository accountRepository;
    private final LoyaltyTransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final LoyaltyProperties props;

    public LoyaltyService(LoyaltyAccountRepository accountRepository,
                          LoyaltyTransactionRepository transactionRepository,
                          UserRepository userRepository, OrderRepository orderRepository,
                          LoyaltyProperties props) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.props = props;
    }

    /** Award points for an order subtotal (delivery excluded). Returns the points earned. */
    @Transactional
    public int award(UUID userId, UUID orderId, BigDecimal subtotal) {
        LoyaltyAccount account = account(userId);
        int basePoints = subtotal.divide(BigDecimal.valueOf(props.madPerPoint()), 0, RoundingMode.DOWN)
                .intValueExact();
        int earned = props.multiplierFor(account.getTier())
                .multiply(BigDecimal.valueOf(basePoints))
                .setScale(0, RoundingMode.DOWN)
                .intValueExact();
        if (earned <= 0) {
            return 0;
        }
        applyMovement(account, userId, orderId, earned, LoyaltyTransactionType.EARNED,
                "Points gagnés pour la commande");
        return earned;
    }

    /** Reverse the points previously earned for an order (cancellation / refund). */
    @Transactional
    public void reverse(UUID userId, UUID orderId) {
        LoyaltyAccount account = account(userId);
        int earned = transactionRepository.findByUserId(userId, Pageable.unpaged()).stream()
                .filter(t -> t.getType() == LoyaltyTransactionType.EARNED)
                .filter(t -> t.getOrder() != null && t.getOrder().getId().equals(orderId))
                .mapToInt(LoyaltyTransaction::getPoints)
                .sum();
        if (earned <= 0) {
            return;
        }
        applyMovement(account, userId, orderId, -earned, LoyaltyTransactionType.REVERSED,
                "Annulation des points de la commande");
    }

    /** Admin: manual adjustment (signed) with a mandatory reason. */
    @Transactional
    public void adjust(UUID userId, int points, String reason) {
        applyMovement(account(userId), userId, null, points, LoyaltyTransactionType.ADJUSTED, reason);
    }

    @Transactional(readOnly = true)
    public LoyaltyResponse getSummary(UUID userId) {
        LoyaltyAccount account = account(userId);
        LoyaltyTier tier = account.getTier();
        int lifetime = account.getLifetimePoints();
        int toNext;
        LoyaltyTier next;
        if (tier == LoyaltyTier.BRONZE) {
            next = LoyaltyTier.ARGENT;
            toNext = Math.max(0, props.argentThreshold() - lifetime);
        } else if (tier == LoyaltyTier.ARGENT) {
            next = LoyaltyTier.OR;
            toNext = Math.max(0, props.orThreshold() - lifetime);
        } else {
            next = null;
            toNext = 0;
        }
        return new LoyaltyResponse(account.getPointsBalance(), tier, lifetime, toNext, next);
    }

    @Transactional(readOnly = true)
    public Page<LoyaltyTransactionResponse> transactions(UUID userId, Pageable pageable) {
        return transactionRepository.findByUserId(userId, pageable)
                .map(t -> new LoyaltyTransactionResponse(t.getId(), t.getPoints(), t.getType(),
                        t.getOrder() == null ? null : t.getOrder().getId(), t.getNote(), t.getCreatedAt()));
    }

    private void applyMovement(LoyaltyAccount account, UUID userId, UUID orderId, int points,
                               LoyaltyTransactionType type, String note) {
        User userRef = userRepository.getReferenceById(userId);
        transactionRepository.save(LoyaltyTransaction.builder()
                .user(userRef)
                .points(points)
                .type(type)
                .order(orderId == null ? null : orderRepository.getReferenceById(orderId))
                .note(note)
                .build());
        account.setPointsBalance(account.getPointsBalance() + points);
        // Lifetime tracks cumulative earned/lost points, never below zero.
        account.setLifetimePoints(Math.max(0, account.getLifetimePoints() + points));
        account.setTier(props.tierForLifetime(account.getLifetimePoints()));
    }

    private LoyaltyAccount account(UUID userId) {
        return accountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Compte fidélité", userId));
    }
}
