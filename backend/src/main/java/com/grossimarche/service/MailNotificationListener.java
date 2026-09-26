package com.grossimarche.service;

import com.grossimarche.entity.Bundle;
import com.grossimarche.entity.BundleItem;
import com.grossimarche.entity.User;
import com.grossimarche.integration.storage.StorageService;
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
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Turns domain events into e-mail.
 *
 * Everything here fires {@code AFTER_COMMIT}, so nothing is ever announced for a transaction
 * that rolled back, and every send goes through {@link Mailer}'s async methods - a customer
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
    /**
     * How many product pictures an announcement carries. Each one is a few kilobytes and every
     * recipient gets its own copy of the message, so a long basket is capped rather than
     * turning a mailshot into a file transfer.
     */
    private static final int MAX_PRODUCT_PICTURES = 8;

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
    private final StorageService storageService;

    public MailNotificationListener(Mailer mailer, UserRepository userRepository,
                                    BundleRepository bundleRepository,
                                    StorageService storageService) {
        this.mailer = mailer;
        this.userRepository = userRepository;
        this.bundleRepository = bundleRepository;
        this.storageService = storageService;
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

    /**
     * Tell an applicant what was decided about their trade account.
     *
     * Sent for a refusal as well as an approval. A silent refusal produces a customer who keeps
     * trying a correct password, then telephones - the reason costs one e-mail and saves that
     * call.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public void onCustomerDecision(CustomerDecisionEvent event) {
        User user = userRepository.findById(event.userId()).orElse(null);
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
            log.warn("Customer decision for {} could not be e-mailed: no address.", event.userId());
            return;
        }

        String shop = user.getBusinessName() != null ? user.getBusinessName() : user.getFullName();
        String loginUrl = mailer.storeUrl() + "/auth/login";

        if (event.approved()) {
            String segment = user.getClientType() == null ? "" : user.getClientType().getName();
            String plain = """
                    Bonjour %s,

                    Votre compte Market Food est activé. Vous pouvez desormais vous connecter
                    et consulter vos tarifs%s.

                    Connexion : %s

                    A bientot.
                    """.formatted(shop, segment.isBlank() ? "" : " (" + segment + ")", loginUrl);
            mailer.sendAsync(user.getEmail(), "Votre compte Market Food est activé", plain,
                    EmailTemplates.accountApprovedEmail(shop, segment, loginUrl));
        } else {
            String plain = """
                    Bonjour %s,

                    Votre demande de compte Market Food n'a pas pu etre acceptée.

                    Motif : %s

                    Si vous pensez qu'il s'agit d'une erreur, répondez à cet e-mail.
                    """.formatted(shop, event.reason());
            mailer.sendAsync(user.getEmail(), "Votre demande de compte Market Food", plain,
                    EmailTemplates.accountRejectedEmail(shop, event.reason()));
        }
    }

    /**
     * Announce a bundle offer to the active customers of the trades it is priced for.
     *
     * Not to every customer: a bundle carries a price per trade, and the storefront hides it
     * from everyone else, so a wider mailshot only invites people to an empty offer page.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public void onBundleAnnounced(BundleAnnouncedEvent event) {
        List<String> recipients =
                userRepository.findActiveClientEmailsByClientTypes(event.clientTypeIds());
        if (recipients.isEmpty()) {
            log.info("Offer '{}' announced to {}, but no customer of that trade has a usable "
                    + "e-mail address.", event.name(), event.audience());
            return;
        }
        log.info("Announcing offer '{}' to {} customer(s) of {}.",
                event.name(), recipients.size(), event.audience());

        Bundle bundle = bundleRepository.findByIdWithItems(event.bundleId()).orElse(null);

        // Every picture travels inside the message: linking one would mean the recipient's
        // client fetching it from this server, which is reachable only from here.
        List<Mailer.InlineImage> pictures = new ArrayList<>();
        boolean hasPhoto = false;
        if (bundle != null) {
            StorageService.StoredFile file = storageService.read(bundle.getImageUrl()).orElse(null);
            if (file != null) {
                pictures.add(Mailer.InlineImage.photo(EmailTemplates.BUNDLE_IMAGE_CID,
                        file.content(), file.contentType()));
                hasPhoto = true;
            }
        }

        List<EmailTemplates.OfferItem> cards = new ArrayList<>();
        StringBuilder itemsPlain = new StringBuilder();
        int index = 0;
        for (BundleAnnouncedEvent.Item item : event.items()) {
            String cid = null;
            // Past this many the message is mostly attachments, and a basket that long is read
            // as a list anyway. The rest keep their lettered tile.
            if (index < MAX_PRODUCT_PICTURES) {
                StorageService.StoredFile file =
                        storageService.read(item.imageUrl()).orElse(null);
                if (file != null) {
                    cid = EmailTemplates.productImageCid(index);
                    pictures.add(Mailer.InlineImage.thumbnail(
                            cid, file.content(), file.contentType()));
                }
            }

            cards.add(new EmailTemplates.OfferItem(
                    item.name(), item.unit(), item.quantity(),
                    item.unitPrice() == null ? "" : money(item.unitPrice()),
                    item.lineTotal() == null ? "" : money(item.lineTotal()),
                    cid, item.rating(), item.reviews()));

            itemsPlain.append("  - ").append(item.name())
                    .append(" x").append(item.quantity());
            if (item.lineTotal() != null) {
                itemsPlain.append("  ").append(money(item.lineTotal()));
            }
            itemsPlain.append('\n');
            index++;
        }
        int itemCount = cards.size();

        String priceLabel = money(event.price());
        boolean saves = event.savings() != null && event.savings().signum() > 0;
        String savingsLabel = saves ? "Vous économisez " + money(event.savings()) : "";

        // What the same products cost bought separately: the figure the basket price is read
        // against. Derived rather than re-queried - the event already carries both halves.
        String wasLabel = saves ? money(event.price().add(event.savings())) : "";
        int savingsPercent = saves
                ? event.savings().multiply(BigDecimal.valueOf(100))
                        .divide(event.price().add(event.savings()), 0, RoundingMode.HALF_UP)
                        .intValue()
                : 0;

        String offerUrl = mailer.storeUrl() + "/offer";
        String description = bundle != null && bundle.getDescription() != null
                && !bundle.getDescription().isBlank()
                ? bundle.getDescription()
                : "Un panier complet, à prix de gros.";

        String plain = """
                Nouveau panier : %s

                %s

                Contenu du panier :
                %s
                Prix du panier : %s
                %s

                Commander ce panier : %s
                """.formatted(event.name(), description, itemsPlain, priceLabel, savingsLabel,
                offerUrl);

        EmailTemplates.BundleOffer offer = new EmailTemplates.BundleOffer(
                event.name(), description, hasPhoto, priceLabel, wasLabel, savingsLabel,
                savingsPercent, EmailTemplates.bundleItemGrid(cards), itemCount,
                event.audience(), offerUrl);

        mailer.broadcast(recipients, "Nouveau panier : " + event.name(), plain,
                EmailTemplates.bundleAnnouncementEmail(offer), pictures);
    }

    /**
     * Mirror a back-office notification to staff inboxes.
     *
     * The in-app feed only helps someone who has the back-office open; a new order at 2am has
     * to reach a person, so the same alert goes out by e-mail to every active staff account.
     */
    // A plain @EventListener, not a transactional one: StaffAlertEvent is published *from*
    // an AFTER_COMMIT listener, so there is no transaction left to hang off - a
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
        mailer.broadcast(recipients, "[Market Food] " + event.title(), plain,
                EmailTemplates.staffAlertEmail(event.title(), event.message(), url));
    }

    private String money(BigDecimal amount) {
        return String.format(Locale.FRANCE, "%.2f DH", amount == null ? BigDecimal.ZERO : amount);
    }
}
