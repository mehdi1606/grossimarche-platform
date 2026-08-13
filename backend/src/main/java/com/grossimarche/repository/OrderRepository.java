package com.grossimarche.repository;

import com.grossimarche.entity.Order;
import com.grossimarche.entity.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {

    Page<Order> findByUserId(UUID userId, Pageable pageable);

    Optional<Order> findByIdAndUserId(UUID id, UUID userId);

    Optional<Order> findByIdempotencyKey(String idempotencyKey);

    Optional<Order> findByOrderNumber(String orderNumber);

    boolean existsByIdempotencyKey(String idempotencyKey);

    // ---- Dashboard / customer aggregates ----------------------------------------------

    long countByStatus(OrderStatus status);

    long countByCreatedAtGreaterThanEqual(Instant since);

    long countByUserId(UUID userId);

    /** Revenue (excluding cancelled orders) placed at or after {@code since}. */
    @Query("select coalesce(sum(o.total), 0) from Order o "
            + "where o.status <> com.grossimarche.entity.enums.OrderStatus.CANCELLED "
            + "and o.createdAt >= :since")
    BigDecimal revenueSince(Instant since);

    /** Total a customer has spent (excluding cancelled orders). */
    @Query("select coalesce(sum(o.total), 0) from Order o "
            + "where o.user.id = :userId "
            + "and o.status <> com.grossimarche.entity.enums.OrderStatus.CANCELLED")
    BigDecimal totalSpentByUser(UUID userId);

    /** Lightweight (createdAt, total) rows for building the daily sales series in one query. */
    @Query("select o.createdAt as createdAt, o.total as total from Order o "
            + "where o.status <> com.grossimarche.entity.enums.OrderStatus.CANCELLED "
            + "and o.createdAt >= :since")
    List<RevenueRow> revenueRowsSince(Instant since);

    /** JPQL projection for the sales series. */
    interface RevenueRow {
        Instant getCreatedAt();

        BigDecimal getTotal();
    }
}
