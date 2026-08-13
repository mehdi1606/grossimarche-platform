package com.grossimarche;

import com.grossimarche.dto.order.CreateOrderRequest;
import com.grossimarche.dto.order.OrderCreatedResponse;
import com.grossimarche.entity.Address;
import com.grossimarche.entity.Category;
import com.grossimarche.entity.LoyaltyAccount;
import com.grossimarche.entity.Product;
import com.grossimarche.entity.User;
import com.grossimarche.entity.enums.LoyaltyTier;
import com.grossimarche.entity.enums.OrderStatus;
import com.grossimarche.entity.enums.PaymentMethod;
import com.grossimarche.entity.enums.PaymentStatus;
import com.grossimarche.entity.enums.Role;
import com.grossimarche.entity.enums.UserStatus;
import com.grossimarche.exception.InsufficientStockException;
import com.grossimarche.exception.ResourceNotFoundException;
import com.grossimarche.repository.AddressRepository;
import com.grossimarche.repository.CategoryRepository;
import com.grossimarche.repository.LoyaltyAccountRepository;
import com.grossimarche.repository.LoyaltyTransactionRepository;
import com.grossimarche.repository.OrderRepository;
import com.grossimarche.repository.ProductRepository;
import com.grossimarche.repository.UserRepository;
import com.grossimarche.service.CartService;
import com.grossimarche.service.CheckoutService;
import com.grossimarche.service.LoyaltyService;
import com.grossimarche.service.OrderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * B6/B7 integration guarantees over real Postgres + Redis: COD checkout end to end,
 * idempotency, concurrent checkout on the last unit, price snapshots, and horizontal
 * authorization (a user cannot read another user's order).
 */
@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class CheckoutIntegrationTest {

    @Autowired CheckoutService checkoutService;
    @Autowired OrderService orderService;
    @Autowired CartService cartService;
    @Autowired LoyaltyService loyaltyService;
    @Autowired UserRepository userRepository;
    @Autowired LoyaltyAccountRepository loyaltyAccountRepository;
    @Autowired LoyaltyTransactionRepository loyaltyTransactionRepository;
    @Autowired CategoryRepository categoryRepository;
    @Autowired ProductRepository productRepository;
    @Autowired AddressRepository addressRepository;
    @Autowired OrderRepository orderRepository;

    @Test
    void codCheckout_computesTotalsServerSide_awardsPoints_decrementsStock_emptiesCart() {
        User user = newUser();
        Product product = newProduct("100.00", 10, 1);
        Address address = newAddress(user);
        cartService.setItemQuantity(user.getId(), product.getId(), 3);

        OrderCreatedResponse response = checkoutService.checkout(user.getId(),
                new CreateOrderRequest(address.getId(), PaymentMethod.COD, null, null), UUID.randomUUID().toString());

        assertThat(response.order().status()).isEqualTo(OrderStatus.CONFIRMED);
        assertThat(response.order().paymentStatus()).isEqualTo(PaymentStatus.PENDING_ON_DELIVERY);
        assertThat(response.order().subtotal()).isEqualByComparingTo("300.00");
        assertThat(response.order().deliveryFee()).isEqualByComparingTo("30.00"); // 300 < 500 threshold
        assertThat(response.order().total()).isEqualByComparingTo("330.00");
        assertThat(response.pointsEarned()).isEqualTo(30); // floor(300/10) * x1

        assertThat(productRepository.findById(product.getId()).orElseThrow().getStockQuantity()).isEqualTo(7);
        assertThat(cartService.getCart(user.getId()).items()).isEmpty();

        // Loyalty invariant: balance equals the sum of the ledger.
        assertThat(loyaltyAccountRepository.findById(user.getId()).orElseThrow().getPointsBalance())
                .isEqualTo(loyaltyTransactionRepository.sumPointsByUserId(user.getId()))
                .isEqualTo(30);
    }

    @Test
    void sameIdempotencyKey_returnsSameOrder_noDuplicate() {
        User user = newUser();
        Product product = newProduct("50.00", 10, 1);
        Address address = newAddress(user);
        cartService.setItemQuantity(user.getId(), product.getId(), 2);
        String key = UUID.randomUUID().toString();
        CreateOrderRequest req = new CreateOrderRequest(address.getId(), PaymentMethod.COD, null, null);

        OrderCreatedResponse first = checkoutService.checkout(user.getId(), req, key);
        OrderCreatedResponse second = checkoutService.checkout(user.getId(), req, key);

        assertThat(second.order().id()).isEqualTo(first.order().id());
        // Exactly one order was ever persisted for this key.
        assertThat(orderRepository.findAll().stream()
                .filter(o -> o.getIdempotencyKey().equals(key)).count()).isEqualTo(1);
    }

    @Test
    void concurrentCheckoutOnLastUnit_exactlyOneSucceeds_stockNeverNegative() throws Exception {
        Product product = newProduct("40.00", 1, 1); // one unit only
        User userA = newUser();
        User userB = newUser();
        Address addrA = newAddress(userA);
        Address addrB = newAddress(userB);
        cartService.setItemQuantity(userA.getId(), product.getId(), 1);
        cartService.setItemQuantity(userB.getId(), product.getId(), 1);

        Callable<Boolean> checkoutA = attempt(userA, addrA);
        Callable<Boolean> checkoutB = attempt(userB, addrB);

        ExecutorService pool = Executors.newFixedThreadPool(2);
        Future<Boolean> fa = pool.submit(checkoutA);
        Future<Boolean> fb = pool.submit(checkoutB);
        int successes = (fa.get() ? 1 : 0) + (fb.get() ? 1 : 0);
        pool.shutdown();

        assertThat(successes).isEqualTo(1);
        assertThat(productRepository.findById(product.getId()).orElseThrow().getStockQuantity()).isZero();
    }

    @Test
    void priceSnapshot_survivesLaterPriceChange() {
        User user = newUser();
        Product product = newProduct("80.00", 10, 1);
        Address address = newAddress(user);
        cartService.setItemQuantity(user.getId(), product.getId(), 1);
        OrderCreatedResponse response = checkoutService.checkout(user.getId(),
                new CreateOrderRequest(address.getId(), PaymentMethod.COD, null, null), UUID.randomUUID().toString());

        Product managed = productRepository.findById(product.getId()).orElseThrow();
        managed.setPrice(new BigDecimal("999.00"));
        productRepository.save(managed);

        assertThat(orderService.getOrder(user.getId(), response.order().id()).items().get(0).unitPrice())
                .isEqualByComparingTo("80.00");
    }

    @Test
    void userCannotReadAnotherUsersOrder() {
        User owner = newUser();
        User other = newUser();
        Product product = newProduct("60.00", 5, 1);
        Address address = newAddress(owner);
        cartService.setItemQuantity(owner.getId(), product.getId(), 1);
        OrderCreatedResponse response = checkoutService.checkout(owner.getId(),
                new CreateOrderRequest(address.getId(), PaymentMethod.COD, null, null), UUID.randomUUID().toString());

        assertThatThrownBy(() -> orderService.getOrder(other.getId(), response.order().id()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ---- fixtures ---------------------------------------------------------------------

    private static final AtomicInteger SEQ = new AtomicInteger();

    private Callable<Boolean> attempt(User user, Address address) {
        return () -> {
            try {
                checkoutService.checkout(user.getId(),
                        new CreateOrderRequest(address.getId(), PaymentMethod.COD, null, null),
                        UUID.randomUUID().toString());
                return true;
            } catch (InsufficientStockException e) {
                return false;
            }
        };
    }

    private User newUser() {
        int n = SEQ.incrementAndGet();
        User user = userRepository.save(User.builder()
                .role(Role.CLIENT).status(UserStatus.ACTIVE)
                .phone("+2126" + String.format("%08d", n))
                .phoneVerified(true).consentAt(java.time.Instant.now()).consentVersion("1.0")
                .build());
        loyaltyAccountRepository.save(LoyaltyAccount.builder()
                .userId(user.getId()).pointsBalance(0).lifetimePoints(0).tier(LoyaltyTier.BRONZE).build());
        return user;
    }

    private Product newProduct(String price, int stock, int minOrder) {
        int n = SEQ.incrementAndGet();
        Category category = categoryRepository.save(Category.builder()
                .name("Cat" + n).slug("cat-" + n + "-" + UUID.randomUUID()).displayOrder(0).active(true).build());
        return productRepository.save(Product.builder()
                .category(category).name("Prod" + n).slug("prod-" + n + "-" + UUID.randomUUID())
                .price(new BigDecimal(price)).unit("unité").stockQuantity(stock)
                .minOrderQuantity(minOrder).active(true).build());
    }

    private Address newAddress(User user) {
        return addressRepository.save(Address.builder()
                .user(user).city("Casablanca").addressLine("123 Rue Test").isDefault(true).build());
    }
}
