package com.grossimarche.controller.admin;

import com.grossimarche.dto.common.PageResponse;
import com.grossimarche.dto.customer.CustomerDetailResponse;
import com.grossimarche.dto.customer.CustomerStatusRequest;
import com.grossimarche.dto.customer.CustomerSummaryResponse;
import com.grossimarche.service.CustomerAdminService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** Admin customer management: list/search, detail, block/unblock. */
@RestController
@RequestMapping("/api/v1/admin/customers")
public class AdminCustomerController {

    private final CustomerAdminService customerAdminService;

    public AdminCustomerController(CustomerAdminService customerAdminService) {
        this.customerAdminService = customerAdminService;
    }

    @GetMapping
    public PageResponse<CustomerSummaryResponse> list(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        return PageResponse.from(customerAdminService.list(q, pageable));
    }

    @GetMapping("/{id}")
    public CustomerDetailResponse detail(@PathVariable UUID id) {
        return customerAdminService.get(id);
    }

    @PatchMapping("/{id}/status")
    public CustomerDetailResponse updateStatus(@PathVariable UUID id,
                                               @Valid @RequestBody CustomerStatusRequest body) {
        return customerAdminService.updateStatus(id, body.status());
    }
}
