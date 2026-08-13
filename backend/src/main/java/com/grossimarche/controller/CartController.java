package com.grossimarche.controller;

import com.grossimarche.dto.cart.CartResponse;
import com.grossimarche.dto.cart.GuestCartMergeRequest;
import com.grossimarche.dto.cart.SetCartItemRequest;
import com.grossimarche.security.SecurityUtils;
import com.grossimarche.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** Authenticated cart operations. */
@RestController
@RequestMapping("/api/v1/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public CartResponse getCart() {
        return cartService.getCart(SecurityUtils.currentUserId());
    }

    @PutMapping("/items/{productId}")
    public CartResponse setItem(@PathVariable UUID productId, @Valid @RequestBody SetCartItemRequest body) {
        return cartService.setItemQuantity(SecurityUtils.currentUserId(), productId, body.quantity());
    }

    @DeleteMapping
    public ResponseEntity<Void> clear() {
        cartService.clear(SecurityUtils.currentUserId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/merge")
    public CartResponse merge(@Valid @RequestBody GuestCartMergeRequest body) {
        return cartService.mergeGuestCart(SecurityUtils.currentUserId(),
                body.items() == null ? java.util.List.of() : body.items());
    }
}
