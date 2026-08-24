package com.grossimarche.dto.order;

import java.util.Map;

import com.grossimarche.entity.enums.OrderStatus;

/**
 * Per-status counters for one customer's order history, so the account dashboard can show
 * real numbers without paging through every order.
 *
 * <p>{@code inProgress} groups CONFIRMED + PREPARING + OUT_FOR_DELIVERY: the shopper-facing
 * "en préparation" bucket. {@code byStatus} keeps the exact breakdown for any finer UI.
 */
public record OrderStatsResponse(
        long total,
        long pending,
        long inProgress,
        long delivered,
        long cancelled,
        Map<OrderStatus, Long> byStatus
) {
}
