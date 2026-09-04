package com.grossimarche.controller.admin;

import com.grossimarche.dto.common.PageResponse;
import com.grossimarche.dto.order.OrderDetailResponse;
import com.grossimarche.dto.order.OrderSummaryResponse;
import com.grossimarche.dto.order.UpdateOrderStatusRequest;
import com.grossimarche.security.SecurityUtils;
import com.grossimarche.service.OrderService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** Admin order management: list, detail, advance status, cancel. */
@RestController
@RequestMapping("/api/v1/admin/orders")
public class AdminOrderController {

    private final OrderService orderService;

    public AdminOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public PageResponse<OrderSummaryResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        return PageResponse.from(orderService.listAll(pageable));
    }

    @GetMapping("/{id}")
    public OrderDetailResponse detail(@PathVariable UUID id) {
        return orderService.adminGetOrder(id);
    }

    @PatchMapping("/{id}/status")
    public OrderDetailResponse advance(@PathVariable UUID id,
                                       @Valid @RequestBody UpdateOrderStatusRequest body) {
        return orderService.advanceStatus(id, body.status(), body.note(), SecurityUtils.currentUserId());
    }

    /**
     * Cancel an order, with the operator's own reason when they gave one.
     *
     * The reason used to be the constant "Annulation administrateur", which told the customer -
     * and the next person to read the timeline - nothing at all. It is optional: an operator in
     * a hurry still gets the old wording rather than being blocked.
     */
    @PostMapping("/{id}/cancel")
    public OrderDetailResponse cancel(@PathVariable UUID id,
                                      @RequestBody(required = false) CancelOrderRequest body) {
        String reason = body == null || body.reason() == null || body.reason().isBlank()
                ? "Annulation administrateur"
                : body.reason().trim();
        return orderService.cancel(id, SecurityUtils.currentUserId(), reason);
    }

    /** Why the order was cancelled. Optional - see {@link #cancel}. */
    public record CancelOrderRequest(@Size(max = 255) String reason) {
    }
}
