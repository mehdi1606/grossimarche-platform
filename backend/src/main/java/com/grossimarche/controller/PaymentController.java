package com.grossimarche.controller;

import com.grossimarche.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * CMI payment webhook. Public (called by the gateway) — the signature is verified inside
 * {@link OrderService#handlePaymentCallback} before any field is trusted. Card fields are
 * never stored; the callback is idempotent.
 */
@RestController
@RequestMapping("/api/v1/payments/cmi")
public class PaymentController {

    private final OrderService orderService;

    public PaymentController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/callback")
    public ResponseEntity<String> callback(@RequestParam Map<String, String> params) {
        orderService.handlePaymentCallback(params);
        return ResponseEntity.ok("OK");
    }
}
