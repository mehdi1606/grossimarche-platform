package com.grossimarche.config;

import com.grossimarche.service.OrderStatusChangedEvent;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Business metrics via Micrometer (exposed through Actuator). Order lifecycle is counted
 * from the domain event, so no service is instrumented directly. JVM/HTTP/DB metrics come
 * from Boot's auto-configuration.
 */
@Component
public class ApplicationMetrics {

    private final MeterRegistry registry;

    public ApplicationMetrics(MeterRegistry registry) {
        this.registry = registry;
    }

    @EventListener
    public void onOrderStatusChanged(OrderStatusChangedEvent event) {
        registry.counter("grossimarche.order.status", "status", event.status().name()).increment();
    }
}
