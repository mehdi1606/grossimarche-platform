package com.grossimarche.websocket;

import com.grossimarche.entity.enums.NotificationType;
import com.grossimarche.entity.enums.PaymentMethod;
import com.grossimarche.service.LowStockEvent;
import com.grossimarche.service.NotificationService;
import com.grossimarche.service.OrderPlacedEvent;
import com.grossimarche.service.StaffAlertEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Locale;

/**
 * Turns domain events into persisted back-office notifications (and a live STOMP push, done
 * inside {@link NotificationService#record}). Fires only {@code AFTER_COMMIT} so the feed never
 * shows events from rolled-back transactions.
 *
 * Each alert is also published as a {@link StaffAlertEvent}, which the mail layer picks up: the
 * in-app feed only reaches someone who has the back-office open, and a new order at 2am has to
 * reach a person.
 */
@Component
public class NotificationEventListener {

    private final NotificationService notificationService;
    private final ApplicationEventPublisher events;

    public NotificationEventListener(NotificationService notificationService,
                                     ApplicationEventPublisher events) {
        this.notificationService = notificationService;
        this.events = events;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOrderPlaced(OrderPlacedEvent event) {
        // Everything the back-office needs to triage the order without opening it: who, how
        // much, how many lines, where, and how it will be paid.
        String message = String.format(Locale.FRANCE,
                "%s — %d article%s (%d unité%s), %.2f DH — %s (%s) — %s.",
                event.orderNumber(),
                event.itemCount(),
                event.itemCount() > 1 ? "s" : "",
                event.unitCount(),
                event.unitCount() > 1 ? "s" : "",
                event.total(),
                event.customerName(),
                event.city(),
                event.paymentMethod() == PaymentMethod.COD
                        ? "paiement à la livraison"
                        : "paiement par carte");

        notificationService.record(NotificationType.NEW_ORDER,
                "Nouvelle commande",
                message,
                event.orderId());
        events.publishEvent(new StaffAlertEvent("Nouvelle commande", message, "/orders"));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onLowStock(LowStockEvent event) {
        String message = event.productName() + " : il reste " + event.remainingStock()
                + " en stock.";
        notificationService.record(NotificationType.LOW_STOCK, "Stock faible", message,
                event.productId());
        events.publishEvent(new StaffAlertEvent("Stock faible", message, "/products"));
    }
}
