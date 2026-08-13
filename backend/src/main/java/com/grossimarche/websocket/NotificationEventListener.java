package com.grossimarche.websocket;

import com.grossimarche.entity.enums.NotificationType;
import com.grossimarche.service.LowStockEvent;
import com.grossimarche.service.NotificationService;
import com.grossimarche.service.OrderPlacedEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Turns domain events into persisted back-office notifications (and a live STOMP push, done
 * inside {@link NotificationService#record}). Fires only {@code AFTER_COMMIT} so the feed
 * never shows events from rolled-back transactions.
 */
@Component
public class NotificationEventListener {

    private final NotificationService notificationService;

    public NotificationEventListener(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOrderPlaced(OrderPlacedEvent event) {
        notificationService.record(NotificationType.NEW_ORDER,
                "Nouvelle commande",
                "Commande " + event.orderNumber() + " reçue.",
                event.orderId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onLowStock(LowStockEvent event) {
        notificationService.record(NotificationType.LOW_STOCK,
                "Stock faible",
                event.productName() + " : il reste " + event.remainingStock() + " en stock.",
                event.productId());
    }
}
