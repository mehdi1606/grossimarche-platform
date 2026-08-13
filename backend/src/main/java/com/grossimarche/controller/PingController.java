package com.grossimarche.controller;

import com.grossimarche.security.SecurityUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Minimal authenticated diagnostics endpoint ("whoami"). Proves the security wiring end
 * to end: anonymous callers get 401, authenticated callers get 200 with their user id.
 */
@RestController
@RequestMapping("/api/v1/ping")
public class PingController {

    @GetMapping
    public PingResponse ping() {
        return new PingResponse("ok", SecurityUtils.currentUserId());
    }

    public record PingResponse(String status, UUID userId) {
    }
}
