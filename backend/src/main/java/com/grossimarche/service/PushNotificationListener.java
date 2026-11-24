package com.grossimarche.service;

import com.grossimarche.config.AsyncConfig;
import com.grossimarche.entity.enums.OrderStatus;
import com.grossimarche.integration.push.PushSender;
import com.grossimarche.repository.DeviceTokenRepository;
import com.grossimarche.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;
import java.util.Map;

/**
 * Turns the same domain events the mail layer listens to into notifications on a phone.
 *
 * A second listener rather than a branch inside the first: the two channels fail
 * independently, reach different people and are configured separately, and a push that cannot
 * be delivered must never stop an e-mail that can.
 *
 * Everything fires {@code AFTER_COMMIT}, so nothing is announced for a transaction that rolled
 * back, and every send is asynchronous - a customer must not wait on Google's servers to see
 * their order confirmed.
 */
@Component
public class PushNotificationListener {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationListener.class);

    /**
     * What each status means to the person waiting for the delivery - the same wording as the
     * e-mail, because a customer who gets both must not read two different stories. PENDING is
     * absent: the order-received screen is already that confirmation.
     */
    private static final Map<OrderStatus, String[]> STATUS_COPY = Map.of(
            OrderStatus.CONFIRMED, new String[]{"Commande confirmée",
                    "Votre commande est validée. Nous la préparons."},
            OrderStatus.PREPARING, new String[]{"Commande en préparation",
                    "Vos articles sont en cours de préparation."},
            OrderStatus.OUT_FOR_DELIVERY, new String[]{"Commande en route",
                    "Notre livreur vous contactera à l'arrivée."},
            OrderStatus.DELIVERED, new String[]{"Commande livrée",
                    "Merci de votre confiance !"},
            OrderStatus.CANCELLED, new String[]{"Commande annulée",
                    "Contactez-nous si vous n'êtes pas à l'origine de cette annulation."});

    private final PushSender pushSender;
    private final DeviceTokenRepository deviceRepository;
    private final UserRepository userRepository;
    private final DeviceService deviceService;

    public PushNotificationListener(PushSender pushSender, DeviceTokenRepository deviceRepository,
                                    UserRepository userRepository, DeviceService deviceService) {
        this.pushSender = pushSender;
        this.deviceRepository = deviceRepository;
        this.userRepository = userRepository;
        this.deviceService = deviceService;
    }

    /** Tell the customer, on their phone, that their order moved. */
    @Async(AsyncConfig.PUSH_EXECUTOR)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public void onOrderStatusChanged(OrderStatusChangedEvent event) {
        String[] copy = STATUS_COPY.get(event.status());
        if (copy == null) {
            return;
        }
        List<String> tokens = deviceRepository.findTokensByUserId(event.userId());
        if (tokens.isEmpty()) {
            return;
        }
        // The order id travels with the message so a tap opens that order rather than the home
        // screen - the whole reason to send it.
        send(tokens, copy[0], copy[1],
                Map.of("type", "order", "orderId", String.valueOf(event.orderId())));
    }

    /**
     * Announce a new basket to the customers of the trades it is priced for.
     *
     * Same audience as the e-mail, resolved the same way: a bundle carries a price per trade,
     * and telling anyone else about an offer they cannot buy is worse than silence.
     */
    @Async(AsyncConfig.PUSH_EXECUTOR)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public void onBundleAnnounced(BundleAnnouncedEvent event) {
        List<java.util.UUID> recipients =
                userRepository.findActiveClientIdsByClientTypes(event.clientTypeIds());
        if (recipients.isEmpty()) {
            return;
        }
        List<String> tokens = deviceRepository.findTokensByUserIds(recipients);
        if (tokens.isEmpty()) {
            log.info("Offer '{}' announced, but no customer of {} has the app installed.",
                    event.name(), event.audience());
            return;
        }
        String body = event.savings() != null && event.savings().signum() > 0
                ? "Un nouveau panier est disponible pour votre activité."
                : "Un nouveau panier vient d'être publié.";
        send(tokens, event.name(), body,
                Map.of("type", "offer", "slug", String.valueOf(event.slug())));
    }

    /**
     * One send, and the cleanup that follows it.
     *
     * A token the service refuses as unregistered is deleted here rather than left to fail
     * again at every announcement: an app uninstalled a year ago would otherwise be written to
     * for as long as the shop exists.
     */
    private void send(List<String> tokens, String title, String body, Map<String, String> data) {
        try {
            deviceService.dropStale(pushSender.send(tokens, title, body, data));
        } catch (Exception e) {
            // A notification is a nicety; the order and the offer are already committed.
            log.error("Push '{}' could not be sent", title, e);
        }
    }
}
