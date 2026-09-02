package com.grossimarche.controller.admin;

import com.grossimarche.dto.dashboard.BestSellerResponse;
import com.grossimarche.dto.dashboard.DashboardSummaryResponse;
import com.grossimarche.dto.dashboard.LabelCountResponse;
import com.grossimarche.dto.dashboard.SalesPointResponse;
import com.grossimarche.dto.order.OrderSummaryResponse;
import com.grossimarche.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Admin dashboard analytics: summary, sales series, best-sellers, recent orders. */
@RestController
@RequestMapping("/api/v1/admin/dashboard")
public class AdminDashboardController {

    private final DashboardService dashboardService;

    public AdminDashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public DashboardSummaryResponse summary() {
        return dashboardService.summary();
    }

    @GetMapping("/sales")
    public List<SalesPointResponse> sales(@RequestParam(defaultValue = "30") int days) {
        return dashboardService.sales(days);
    }

    @GetMapping("/best-sellers")
    public List<BestSellerResponse> bestSellers(@RequestParam(defaultValue = "5") int limit) {
        return dashboardService.bestSellers(limit);
    }

    @GetMapping("/recent-orders")
    public List<OrderSummaryResponse> recentOrders(@RequestParam(defaultValue = "10") int limit) {
        return dashboardService.recentOrders(limit);
    }

    /** Where the deliveries go: one slice per city. */
    @GetMapping("/deliveries-by-city")
    public List<LabelCountResponse> deliveriesByCity(@RequestParam(defaultValue = "10") int limit) {
        return dashboardService.deliveriesByCity(limit);
    }

    /** Who the customers are: one bar per trade segment. */
    @GetMapping("/customers-by-type")
    public List<LabelCountResponse> customersByClientType() {
        return dashboardService.customersByClientType();
    }
}
