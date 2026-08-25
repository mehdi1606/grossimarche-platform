package com.grossimarche.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Assigns each request a trace id: it propagates an incoming {@value #HEADER} if present,
 * otherwise generates a short one. The id is placed in the SLF4J MDC (key
 * {@value #MDC_KEY}, rendered on every log line - see application.yml), echoed back in
 * the {@value #HEADER} response header, and embedded in every {@code ApiError} body.
 *
 * <p>Runs first so the id is available to all downstream logging and error handling.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestTraceFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Request-Id";
    public static final String MDC_KEY = "traceId";

    /** The current request's trace id, or {@code null} outside a request. */
    public static String currentTraceId() {
        return MDC.get(MDC_KEY);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String incoming = request.getHeader(HEADER);
        String traceId = StringUtils.hasText(incoming)
                ? incoming
                : UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        MDC.put(MDC_KEY, traceId);
        response.setHeader(HEADER, traceId);
        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_KEY);
        }
    }
}
