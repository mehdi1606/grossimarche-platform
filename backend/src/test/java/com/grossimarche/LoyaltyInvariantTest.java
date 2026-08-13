package com.grossimarche;

import com.grossimarche.entity.LoyaltyAccount;
import com.grossimarche.entity.Order;
import com.grossimarche.entity.User;
import com.grossimarche.entity.enums.LoyaltyTier;
import com.grossimarche.entity.enums.OrderStatus;
import com.grossimarche.entity.enums.PaymentMethod;
import com.grossimarche.entity.enums.PaymentStatus;
import com.grossimarche.entity.enums.Role;
import com.grossimarche.entity.enums.UserStatus;
import com.grossimarche.repository.LoyaltyAccountRepository;
import com.grossimarche.repository.LoyaltyTransactionRepository;
import com.grossimarche.repository.OrderRepository;
import com.grossimarche.repository.UserRepository;
import com.grossimarche.service.LoyaltyService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.Random;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * B7 core invariant: an account's balance always equals the sum of its ledger, after any
 * sequence of operations. Runs 100 random award/reverse/adjust operations and checks the
 * invariant after each.
 */
@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class LoyaltyInvariantTest {

    @Autowired LoyaltyService loyaltyService;
    @Autowired UserRepository userRepository;
    @Autowired LoyaltyAccountRepository loyaltyAccountRepository;
    @Autowired LoyaltyTransactionRepository loyaltyTransactionRepository;
    @Autowired OrderRepository orderRepository;

    @Test
    void balanceAlwaysEqualsLedger_after100RandomOperations() {
        User user = userRepository.save(User.builder()
                .role(Role.CLIENT).status(UserStatus.ACTIVE)
                .phone("+2127" + String.format("%08d", new Random().nextInt(100_000_000)))
                .phoneVerified(true).consentAt(java.time.Instant.now()).consentVersion("1.0").build());
        loyaltyAccountRepository.save(LoyaltyAccount.builder()
                .userId(user.getId()).pointsBalance(0).lifetimePoints(0).tier(LoyaltyTier.BRONZE).build());
        Order order = newOrder(user);

        Random random = new Random(42);
        for (int i = 0; i < 100; i++) {
            switch (random.nextInt(3)) {
                case 0 -> loyaltyService.award(user.getId(), order.getId(),
                        new BigDecimal(10 + random.nextInt(2000)));
                case 1 -> loyaltyService.reverse(user.getId(), order.getId());
                default -> loyaltyService.adjust(user.getId(), random.nextInt(201) - 100, "test");
            }

            int balance = loyaltyAccountRepository.findById(user.getId()).orElseThrow().getPointsBalance();
            int ledger = loyaltyTransactionRepository.sumPointsByUserId(user.getId());
            assertThat(balance).as("balance == sum(ledger) at step %d", i).isEqualTo(ledger);
        }
    }

    private Order newOrder(User user) {
        return orderRepository.save(Order.builder()
                .orderNumber("INV-" + UUID.randomUUID().toString().substring(0, 12))
                .user(user).addressSnapshot("{}")
                .status(OrderStatus.CONFIRMED).paymentMethod(PaymentMethod.COD)
                .paymentStatus(PaymentStatus.PENDING_ON_DELIVERY)
                .subtotal(BigDecimal.ZERO).discountTotal(BigDecimal.ZERO)
                .couponDiscount(BigDecimal.ZERO)
                .deliveryFee(BigDecimal.ZERO).total(BigDecimal.ZERO)
                .idempotencyKey(UUID.randomUUID().toString())
                .build());
    }
}
