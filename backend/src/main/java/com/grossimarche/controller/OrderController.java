package com.grossimarche.controller;

import com.grossimarche.dto.common.PageResponse;
import com.grossimarche.dto.order.CreateOrderRequest;
import com.grossimarche.dto.order.OrderCreatedResponse;
import com.grossimarche.dto.order.OrderDetailResponse;
import com.grossimarche.dto.order.OrderStatsResponse;
import com.grossimarche.dto.order.OrderSummaryResponse;
import com.grossimarche.security.SecurityUtils;
import com.grossimarche.service.CheckoutService;
import com.grossimarche.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** Authenticated order operations: checkout, history, detail, invoice. */
@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final CheckoutService checkoutService;
    private final OrderService orderService;

    public OrderController(CheckoutService checkoutService, OrderService orderService) {
        this.checkoutService = checkoutService;
        this.orderService = orderService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderCreatedResponse checkout(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody CreateOrderRequest body) {
        return checkoutService.checkout(SecurityUtils.currentUserId(), body, idempotencyKey);
    }

    @GetMapping
    public PageResponse<OrderSummaryResponse> history(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, Math.min(size, 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return PageResponse.from(orderService.getOrders(SecurityUtils.currentUserId(), pageable));
    }

    @GetMapping("/stats")
    public OrderStatsResponse stats() {
        return orderService.getStats(SecurityUtils.currentUserId());
    }

    @GetMapping("/{id}")
    public OrderDetailResponse detail(@PathVariable UUID id) {
        return orderService.getOrder(SecurityUtils.currentUserId(), id);
    }

    /** Cancel one's own order - allowed only while it is still PENDING. */
    @PostMapping("/{id}/cancel")
    public OrderDetailResponse cancel(@PathVariable UUID id) {
        return orderService.cancelOwn(SecurityUtils.currentUserId(), id);
    }

    @GetMapping("/{id}/invoice")
    public ResponseEntity<byte[]> invoice(@PathVariable UUID id) {
        byte[] pdf = orderService.generateInvoice(SecurityUtils.currentUserId(), id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"facture-" + id + ".pdf\"")
                .body(pdf);
    }
}
