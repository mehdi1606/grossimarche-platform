package com.grossimarche.service;

import com.grossimarche.entity.Bundle;
import com.grossimarche.entity.User;
import com.grossimarche.entity.enums.OrderStatus;
import com.grossimarche.entity.enums.Role;
import com.grossimarche.integration.email.EmailTemplates;
import com.grossimarche.integration.email.Mailer;
import com.grossimarche.repository.BundleRepository;
import com.grossimarche.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Turns domain events into e-mail.
 *
 * Everything here fires {@code AFTER_COMMIT}, so nothing is ever announced for a transaction
 * that rolled back, and every send goes through {@link Mailer}'s async methods — a customer
 * waiting on an SMTP handshake would be a strange way to confirm their order.
 *
 * A delivery failure is logged and dropped on purpose: an order must not fail because a relay
 * was down, and an offer must not be un-published because one inbox rejected the message.
 */
@Component
public class MailNotificationListener {

    private static final Logger log = LoggerFactory.getLogger(MailNotificationListener.class);

    /**
     * What each status means to the person waiting for the delivery. PENDING is absent on
     * purpose: it is the state an order is created in, and the order-received message is
     * already the confirmation the shopper sees on screen.
     */
    private static final Map<OrderStatus, String[]> STATUS_COPY = Map.of(
            OrderStatus.CONFIRMED, new String[]{"Confirmée",
                    "Votre commande est validée par notre équipe. Nous la préparons."},
            OrderStatus.PREPARING, new String[]{"En préparation",
                    "Vos articles sont en cours de préparation dans notre entrepôt."},
            OrderStatus.OUT_FOR_DELIVERY, new String[]{"En cours de livraison",
                    "Votre commande est en route. Notre livreur vous contactera à l'arrivée."},
            OrderStatus.DELIVERED, new String[]{"Livrée",
                    "Votre commande vous a été remise. Merci de votre confiance !"},
            OrderStatus.CANCELLED, new String[]{"Annulée",
                    "Votre commande a été annulée. Si vous n'êtes pas à l'origine de cette "
                            + "annulation, contactez-nous."});

    private final Mailer mailer;
    private final UserRepository userRepository;
    private final BundleRepository bundleRepository;

    public MailNotificationListener(Mailer mailer, UserRepository userRepository,
                                    BundleRepository bundleRepository) {
        this.mailer = mailer;
        this.userRepository = userRepository;
        this.bundleRepository = bundleRepository;
    }

    /** Tell the customer their order moved. */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public void onOrderStatusChanged(OrderStatusChangedEvent event) {
        String[] copy = STATUS_COPY.get(event.status());
        if (copy == null) {
            return;
        }
        User user = userRepository.findById(event.userId()).orElse(null);
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
            // Phone-only accounts exist; there is simply nowhere to send this.
            return;
        }
        String trackUrl = mailer.storeUrl() + "/order/" + event.orderId();
        String plain = """
                Votre commande %s : %s

                %s

                Suivre votre commande : %s
                """.formatted(event.orderNumber(), copy[0], copy[1], trackUrl);

        mailer.sendAsync(user.getEmail(),
                "Commande " + event.orderNumber() + " : " + copy[0].toLowerCase(Locale.FRENCH),
                plain,
                EmailTemplates.orderStatusEmail(event.orderNumber(), copy[0], copy[1], trackUrl));
    }

    /** Announce a bundle offer to every active customer who has an e-mail address. */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public void onBundleAnnounced(BundleAnnouncedEvent event) {
        List<String> recipients = userRepository.findActiveEmailsByRoles(List.of(Role.CLIENT));
        if (recipients.isEmpty()) {
            log.info("Offer '{}' announced, but no customer has a usable e-mail address.",
                    event.name());
            return;
        }

        Bundle bundle = bundleRepository.findByIdWithItems(event.bundleId()).orElse(null);
        StringBuilder itemsHtml = new StringBuilder();
        StringBuilder itemsPlain = new StringBuilder();
        if (bundle != null) {
            bundle.getItems().forEach(item -> {
                itemsHtml.append(EmailTemplates.bundleItemRow(
                        item.getProduct().getName(), item.getQuantity()));
                itemsPlain.append("  - ").append(item.getProduct().getName())
                        .append(" x").append(item.getQuantity()).append('\n');
            });
        }

        String priceLabel = money(event.price());
        String savingsLabel = event.savings() != null && event.savings().signum() > 0
                ? "Vous économisez " + money(event.savings())
                : "";
        String offerUrl = mailer.storeUrl() + "/offer";
        String description = bundle != null && bundle.getDescription() != null
                ? bundle.getDescription()
                : "Un panier complet, à prix de gros.";

        String plain = """
                Nouvelle offre : %s

                %s

                Contenu du panier :
                %s
                Prix du panier : %s
                %s

                Voir l'offre : %s
                """.formatted(event.name(), description, itemsPlain, priceLabel, savingsLabel,
                offerUrl);

        mailer.broadcast(recipients, "Nouvelle offre : " + event.name(), plain,
                EmailTemplates.bundleAnnouncementEmail(event.name(), description, priceLabel,
                        savingsLabel, itemsHtml.toString(), offerUrl));
    }

    /**
     * Mirror a back-office notification to staff inboxes.
     *
     * The in-app feed only helps someone who has the back-office open; a new order at 2am has
     * to reach a person, so the same alert goes out by e-mail to every active staff account.
     */
    // A plain @EventListener, not a transactional one: StaffAlertEvent is published *from*
    // an AFTER_COMMIT listener, so there is no transaction left to hang off — a
    // @TransactionalEventListener would simply never fire.
    @EventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public void onStaffAlert(StaffAlertEvent event) {
        List<String> recipients =
                userRepository.findActiveEmailsByRoles(List.of(Role.ADMIN, Role.STORE_MANAGER));
        if (recipients.isEmpty()) {
            return;
        }
        String url = mailer.adminUrl() + event.path();
        String plain = "%s%n%n%s%n%nOuvrir le back-office : %s%n"
                .formatted(event.title(), event.message(), url);
        mailer.broadcast(recipients, "[Grossimarché] " + event.title(), plain,
                EmailTemplates.staffAlertEmail(event.title(), event.message(), url));
    }

    private String money(BigDecimal amount) {
        return String.format(Locale.FRANCE, "%.2f DH", amount == null ? BigDecimal.ZERO : amount);
    }
}
