package com.grossimarche.dto.dashboard;

import java.math.BigDecimal;

/** Headline figures for the admin dashboard. Revenue excludes cancelled orders. */
public record DashboardSummaryResponse(
        BigDecimal revenueToday,
        BigDecimal revenueWeek,
        BigDecimal revenueMonth,
        long ordersToday,
        long ordersWeek,
        long ordersMonth,
        long totalOrders,
        long pendingOrders,
        long processingOrders,
        long deliveredOrders,
        long cancelledOrders,
        long totalCustomers
) {
}
