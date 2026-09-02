package com.grossimarche.service;

import com.grossimarche.dto.dashboard.BestSellerResponse;
import com.grossimarche.dto.dashboard.DashboardSummaryResponse;
import com.grossimarche.dto.dashboard.LabelCountResponse;
import com.grossimarche.dto.dashboard.SalesPointResponse;
import com.grossimarche.dto.mapper.OrderMapper;
import com.grossimarche.dto.order.OrderSummaryResponse;
import com.grossimarche.entity.enums.OrderStatus;
import com.grossimarche.entity.enums.Role;
import com.grossimarche.repository.OrderItemRepository;
import com.grossimarche.repository.OrderRepository;
import com.grossimarche.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Read-only analytics for the admin dashboard, aggregated from live order/user data
 * (cancelled orders are excluded from revenue). Every method is admin-only.
 */
@Service
public class DashboardService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final OrderMapper orderMapper;

    public DashboardService(OrderRepository orderRepository, OrderItemRepository orderItemRepository,
                            UserRepository userRepository, OrderMapper orderMapper) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
        this.orderMapper = orderMapper;
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional(readOnly = true)
    public DashboardSummaryResponse summary() {
        Instant todayStart = LocalDate.now(ZoneOffset.UTC).atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant weekStart = todayStart.minus(java.time.Duration.ofDays(6));
        Instant monthStart = todayStart.minus(java.time.Duration.ofDays(29));
        long processing = orderRepository.countByStatus(OrderStatus.CONFIRMED)
                + orderRepository.countByStatus(OrderStatus.PREPARING)
                + orderRepository.countByStatus(OrderStatus.OUT_FOR_DELIVERY);
        return new DashboardSummaryResponse(
                orderRepository.revenueSince(todayStart),
                orderRepository.revenueSince(weekStart),
                orderRepository.revenueSince(monthStart),
                orderRepository.countByCreatedAtGreaterThanEqual(todayStart),
                orderRepository.countByCreatedAtGreaterThanEqual(weekStart),
                orderRepository.countByCreatedAtGreaterThanEqual(monthStart),
                orderRepository.count(),
                orderRepository.countByStatus(OrderStatus.PENDING),
                processing,
                orderRepository.countByStatus(OrderStatus.DELIVERED),
                orderRepository.countByStatus(OrderStatus.CANCELLED),
                userRepository.countByRole(Role.CLIENT));
    }

    /** Daily revenue + order count for the last {@code days} days (zeros filled in). */
    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional(readOnly = true)
    public List<SalesPointResponse> sales(int days) {
        int span = Math.min(Math.max(days, 1), 90);
        LocalDate from = LocalDate.now(ZoneOffset.UTC).minusDays(span - 1L);
        Instant since = from.atStartOfDay(ZoneOffset.UTC).toInstant();

        Map<LocalDate, BigDecimal> revenue = new HashMap<>();
        Map<LocalDate, Long> counts = new HashMap<>();
        for (OrderRepository.RevenueRow row : orderRepository.revenueRowsSince(since)) {
            LocalDate day = LocalDate.ofInstant(row.getCreatedAt(), ZoneOffset.UTC);
            revenue.merge(day, row.getTotal(), BigDecimal::add);
            counts.merge(day, 1L, Long::sum);
        }

        List<SalesPointResponse> series = new ArrayList<>(span);
        for (int i = 0; i < span; i++) {
            LocalDate day = from.plusDays(i);
            series.add(new SalesPointResponse(day,
                    revenue.getOrDefault(day, BigDecimal.ZERO).setScale(2, java.math.RoundingMode.HALF_UP),
                    counts.getOrDefault(day, 0L)));
        }
        return series;
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional(readOnly = true)
    public List<BestSellerResponse> bestSellers(int limit) {
        return orderItemRepository.bestSellers(PageRequest.of(0, Math.min(Math.max(limit, 1), 50)));
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional(readOnly = true)
    public List<OrderSummaryResponse> recentOrders(int limit) {
        var pageable = PageRequest.of(0, Math.min(Math.max(limit, 1), 50),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return orderRepository.findAll(pageable).map(orderMapper::toSummary).getContent();
    }

    /**
     * Deliveries per city, for the dashboard breakdown. Capped so one chart cannot turn into a
     * legend of forty slices; anything past the top ten is summed into "Autres" rather than
     * dropped, which keeps the total honest.
     */
    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional(readOnly = true)
    public List<LabelCountResponse> deliveriesByCity(int limit) {
        List<OrderRepository.LabelCount> rows = orderRepository.countDeliveriesByCity();
        int keep = Math.min(Math.max(limit, 1), 20);
        List<LabelCountResponse> top = rows.stream()
                .limit(keep)
                .map(r -> new LabelCountResponse(r.getLabel(), r.getTotal()))
                .collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));
        long rest = rows.stream().skip(keep).mapToLong(OrderRepository.LabelCount::getTotal).sum();
        if (rest > 0) {
            top.add(new LabelCountResponse("Autres", rest));
        }
        return top;
    }

    /** Customers per trade segment, for the dashboard breakdown. */
    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional(readOnly = true)
    public List<LabelCountResponse> customersByClientType() {
        return userRepository.countCustomersByClientType().stream()
                .map(row -> new LabelCountResponse((String) row[0], ((Number) row[1]).longValue()))
                .toList();
    }
}
