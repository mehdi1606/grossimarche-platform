package com.grossimarche.controller;

import com.grossimarche.dto.translation.TranslateRequest;
import com.grossimarche.dto.translation.TranslateResponse;
import com.grossimarche.exception.RateLimitExceededException;
import com.grossimarche.service.RateLimitService;
import com.grossimarche.service.TranslationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.List;

/** Public batch translation endpoint backed by the self-hosted LibreTranslate + Redis cache. */
@RestController
@RequestMapping("/api/v1/translate")
public class TranslationController {

    /**
     * The storefront translates the page it renders, so this endpoint is called by ordinary
     * browsing rather than by an admin action — and it is unauthenticated. The window is wide
     * enough for a real visitor opening page after page in a cold cache, and narrow enough
     * that nobody can use the shop as a free translation API.
     */
    private static final int REQUESTS_PER_WINDOW = 60;
    private static final Duration WINDOW = Duration.ofMinutes(1);
    /** Strings per request; the storefront chunks at 40. */
    private static final int MAX_BATCH = 100;

    private final TranslationService translationService;
    private final RateLimitService rateLimiter;

    public TranslationController(TranslationService translationService,
                                 RateLimitService rateLimiter) {
        this.translationService = translationService;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping
    public TranslateResponse translate(@Valid @RequestBody TranslateRequest req,
                                       HttpServletRequest request) {
        RateLimitService.Result limit = rateLimiter.hit(
                "rl:translate:" + clientIp(request), REQUESTS_PER_WINDOW, WINDOW);
        if (!limit.allowed()) {
            throw new RateLimitExceededException(limit.retryAfterSeconds(),
                    "Trop de demandes de traduction. Réessayez dans un instant.");
        }

        String source = (req.source() == null || req.source().isBlank()) ? "fr" : req.source();
        List<String> q = req.q() == null ? List.of() : req.q();
        if (q.size() > MAX_BATCH) {
            q = q.subList(0, MAX_BATCH);
        }
        return new TranslateResponse(translationService.translateBatch(q, source, req.target()));
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwarded)) {
            // First hop is the original client.
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
