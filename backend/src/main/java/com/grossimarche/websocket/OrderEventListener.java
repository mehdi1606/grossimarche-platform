package com.grossimarche.websocket;

import com.grossimarche.service.OrderStatusChangedEvent;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.Instant;

/**
 * Bridges domain events to STOMP subscribers. Fires only {@code AFTER_COMMIT}, so a
 * rolled-back transaction publishes nothing and clients never observe uncommitted state.
 * Sends to the order owner's topic and to the back-office topic.
 */
@Component
public class OrderEventListener {

    private final SimpMessagingTemplate messagingTemplate;

    public OrderEventListener(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOrderStatusChanged(OrderStatusChangedEvent event) {
        OrderStatusEvent payload = new OrderStatusEvent(event.orderId(), event.orderNumber(),
                event.status(), Instant.now(), event.message());
        messagingTemplate.convertAndSend("/topic/orders/" + event.orderId(), payload);
        messagingTemplate.convertAndSend("/topic/admin/orders", payload);
    }
}
