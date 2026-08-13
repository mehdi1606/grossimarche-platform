package com.grossimarche.controller;

import com.grossimarche.dto.common.PageResponse;
import com.grossimarche.dto.loyalty.LoyaltyResponse;
import com.grossimarche.dto.loyalty.LoyaltyTransactionResponse;
import com.grossimarche.security.SecurityUtils;
import com.grossimarche.service.LoyaltyService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Authenticated loyalty balance, tier and ledger. */
@RestController
@RequestMapping("/api/v1/loyalty")
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    public LoyaltyController(LoyaltyService loyaltyService) {
        this.loyaltyService = loyaltyService;
    }

    @GetMapping
    public LoyaltyResponse summary() {
        return loyaltyService.getSummary(SecurityUtils.currentUserId());
    }

    @GetMapping("/transactions")
    public PageResponse<LoyaltyTransactionResponse> transactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        return PageResponse.from(loyaltyService.transactions(SecurityUtils.currentUserId(), pageable));
    }
}
