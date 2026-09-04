package com.grossimarche.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Says out loud that API answers must not be reused.
 *
 * Every {@code /api/} response went out with no cache directive at all - no Cache-Control, no
 * Expires, no validator. That is not "do not cache": it is "decide for yourself", and browsers
 * and intermediaries are entitled to serve a stored copy. A refetch triggered by the
 * back-office after saving something could therefore be answered from the browser's own cache,
 * showing the operator exactly what they had before and sending them to the reload button.
 *
 * Stating it removes the ambiguity. Uploaded files under {@code /files/} are deliberately left
 * alone: they are immutable, named by a random id, and worth caching hard.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class ApiCacheHeadersFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        if (request.getRequestURI().startsWith("/api/")) {
            response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store, must-revalidate");
            response.setHeader(HttpHeaders.PRAGMA, "no-cache");
        }
        chain.doFilter(request, response);
    }
}
