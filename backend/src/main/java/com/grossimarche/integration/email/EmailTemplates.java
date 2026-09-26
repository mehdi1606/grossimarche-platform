package com.grossimarche.integration.email;

import jakarta.mail.MessagingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.MimeMessageHelper;

import java.time.Year;
import java.util.List;

/**
 * Branded, email-client-safe HTML templates (table layout + inline styles, no external CSS
 * or web fonts, so Gmail / Outlook render them correctly). {@link #layout} is the shared
 * Market Food shell (header wordmark, emerald accent, dark footer); build new transactional
 * emails by wrapping their content with it.
 */
public final class EmailTemplates {

    private static final Logger log = LoggerFactory.getLogger(EmailTemplates.class);

    /**
     * The logo travels with the message.
     *
     * An e-mail cannot show a file from this server: the recipient's client fetches images over
     * the public internet, and there is no public URL for a shop still on localhost. An inline
     * part referenced by {@code cid:} is carried inside the message itself, which every client
     * renders without asking - and which keeps working when the domain changes.
     */
    public static final String LOGO_CID = "brandLogo";
    private static final String LOGO_PATH = "email/logo-horizontal.png";

    /** The offer's own photo, carried the same way and for the same reason as the logo. */
    public static final String BUNDLE_IMAGE_CID = "bundleImage";

    private EmailTemplates() {
    }

    /** Attach the wordmark the shell points at. Call it after {@code setText}. */
    public static void attachLogo(MimeMessageHelper helper) {
        ClassPathResource logo = new ClassPathResource(LOGO_PATH);
        if (!logo.exists()) {
            // The shell's alt text still names the shop, so a missing file costs the picture
            // and nothing else.
            log.warn("E-mail logo {} is missing; sending without it.", LOGO_PATH);
            return;
        }
        try {
            helper.addInline(LOGO_CID, logo, "image/png");
        } catch (MessagingException e) {
            log.warn("Could not attach the e-mail logo", e);
        }
    }

    /**
     * Attach a picture the body refers to as {@code cid:<cid>}. Call it after {@code setText}.
     *
     * A failure costs the picture and nothing else: the template draws its own band when the
     * image is missing, so the announcement still goes out looking finished.
     */
    public static void attachInline(MimeMessageHelper helper, String cid, byte[] content,
                                    String contentType) {
        if (content == null || content.length == 0) {
            return;
        }
        try {
            helper.addInline(cid, new ByteArrayResource(content), contentType);
        } catch (MessagingException e) {
            log.warn("Could not attach the inline image {}", cid, e);
        }
    }

    /** Wrap body content in the branded shell. {@code preheader} is the inbox preview line. */
    public static String layout(String preheader, String contentHtml) {
        return shell(preheader, """
                <tr><td style="height:4px;line-height:4px;font-size:4px;background:#10b981;">&nbsp;</td></tr>
                <tr><td style="background:#ffffff;padding:38px 32px;">{{CONTENT}}</td></tr>
                """.replace("{{CONTENT}}", contentHtml));
    }

    /**
     * The same shell, with the body rows supplied whole.
     *
     * For content that has to reach the edges - an offer's banner photo, which loses its effect
     * inset by the 32px the padded layout applies to everything.
     */
    public static String layoutOpen(String preheader, String bodyRowsHtml) {
        return shell(preheader, bodyRowsHtml);
    }

    private static String shell(String preheader, String bodyRows) {
        String year = String.valueOf(Year.now().getValue());
        return ("""
                <!DOCTYPE html>
                <html lang="fr">
                <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
                <style>
                  /* Product cards side by side on a screen, stacked on a phone. Outlook on the
                     desktop ignores this and keeps the three-column table, which suits it. */
                  @media only screen and (max-width:600px){
                    .col{display:block !important;width:100% !important;max-width:100% !important;}
                    .gap{display:none !important;}
                  }
                </style></head>
                <body style="margin:0;padding:0;background:#f3f4f6;">
                  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">{{PREHEADER}}</span>
                  <div style="background:#f3f4f6;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
                      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
                        <tr><td style="padding:26px 32px;background:#ffffff;border-radius:16px 16px 0 0;">
                          <img src="cid:brandLogo" alt="Market Food" width="190" style="display:block;border:0;outline:none;text-decoration:none;height:auto;">
                        </td></tr>
                        {{CONTENT}}
                        <tr><td style="background:#1f2937;padding:26px 32px;border-radius:0 0 16px 16px;text-align:center;">
                          <p style="margin:0;color:#ffffff;font-weight:700;font-size:15px;">Market Food</p>
                          <p style="margin:6px 0 0;color:#9ca3af;font-size:12px;">March&eacute; de gros &middot; Livraison au Maroc</p>
                          <p style="margin:14px 0 0;color:#6b7280;font-size:11px;">&copy; {{YEAR}} Market Food. Tous droits r&eacute;serv&eacute;s.</p>
                        </td></tr>
                      </table>
                    </td></tr></table>
                  </div>
                </body></html>
                """)
                .replace("{{PREHEADER}}", escape(preheader))
                .replace("{{CONTENT}}", bodyRows)
                .replace("{{YEAR}}", year);
    }

    /** The passwordless login-code email. */
    public static String otpEmail(String code) {
        String content = ("""
                <h1 style="margin:0 0 10px;font-size:20px;color:#111827;">Votre code de connexion</h1>
                <p style="margin:0 0 26px;font-size:14px;line-height:22px;color:#6b7280;">
                  Utilisez ce code &agrave; usage unique pour vous connecter &agrave; Market Food.
                  Il expire dans 5&nbsp;minutes.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
                  <div style="display:inline-block;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:14px;padding:20px 34px;">
                    <span style="font-size:34px;font-weight:800;letter-spacing:12px;color:#059669;">{{CODE}}</span>
                  </div>
                </td></tr></table>
                <p style="margin:26px 0 0;font-size:13px;line-height:20px;color:#9ca3af;">
                  Si vous n'&ecirc;tes pas &agrave; l'origine de cette demande, ignorez cet e-mail&nbsp;-
                  votre compte reste s&eacute;curis&eacute;.
                </p>
                """).replace("{{CODE}}", escape(code));
        return layout("Votre code de connexion Market Food", content);
    }

    /**
     * The back-office invitation: credentials for a newly created staff account.
     *
     * The password is shown once, here, and nowhere else - it is stored only as a hash, so
     * neither we nor an admin can retrieve it later; a lost password is reset, not looked up.
     */
    public static String staffInviteEmail(String fullName, String email, String password,
                                          String loginUrl) {
        String greeting = (fullName == null || fullName.isBlank())
                ? "Bonjour," : "Bonjour " + escape(fullName) + ",";
        String content = ("""
                <h1 style="margin:0 0 10px;font-size:20px;color:#111827;">Votre acc&egrave;s au back-office</h1>
                <p style="margin:0 0 8px;font-size:14px;line-height:22px;color:#374151;">{{GREETING}}</p>
                <p style="margin:0 0 26px;font-size:14px;line-height:22px;color:#6b7280;">
                  Un compte vient d'&ecirc;tre cr&eacute;&eacute; pour vous sur Market Food.
                  Voici vos identifiants de connexion&nbsp;:
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                       style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;">
                  <tr><td style="padding:18px 22px;">
                    <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Identifiant</p>
                    <p style="margin:0 0 16px;font-size:15px;color:#111827;font-weight:600;">{{EMAIL}}</p>
                    <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Mot de passe provisoire</p>
                    <p style="margin:0;font-size:20px;color:#059669;font-weight:800;font-family:'Courier New',Courier,monospace;letter-spacing:1px;">{{PASSWORD}}</p>
                  </td></tr>
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:26px;"><tr><td align="center">
                  <a href="{{LOGIN_URL}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 34px;border-radius:10px;">Se connecter</a>
                </td></tr></table>
                <p style="margin:26px 0 0;font-size:13px;line-height:20px;color:#9ca3af;">
                  Ce mot de passe est provisoire&nbsp;: il vous sera demand&eacute; d'en choisir un
                  nouveau &agrave; votre premi&egrave;re connexion. Ne le transmettez &agrave; personne.
                </p>
                """)
                .replace("{{GREETING}}", greeting)
                .replace("{{EMAIL}}", escape(email))
                .replace("{{PASSWORD}}", escape(password))
                .replace("{{LOGIN_URL}}", escape(loginUrl));
        return layout("Vos identifiants Market Food", content);
    }

    /**
     * Order-status update for the customer.
     *
     * The status is spelled out in the shopper's own words rather than as the enum name, and
     * the button goes to the tracking page - this e-mail exists to stop the "where is my
     * order?" message, so it has to answer that question by itself.
     */
    public static String orderStatusEmail(String orderNumber, String statusLabel,
                                          String explanation, String trackUrl) {
        String content = ("""
                <h1 style="margin:0 0 10px;font-size:20px;color:#111827;">Votre commande {{NUMBER}}</h1>
                <p style="margin:0 0 26px;font-size:14px;line-height:22px;color:#6b7280;">{{EXPLANATION}}</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                       style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:14px;">
                  <tr><td style="padding:20px 24px;text-align:center;">
                    <p style="margin:0 0 4px;font-size:12px;color:#059669;text-transform:uppercase;letter-spacing:1px;">Statut</p>
                    <p style="margin:0;font-size:22px;font-weight:800;color:#047857;">{{STATUS}}</p>
                  </td></tr>
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:26px;"><tr><td align="center">
                  <a href="{{URL}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 34px;border-radius:10px;">Suivre ma commande</a>
                </td></tr></table>
                """)
                .replace("{{NUMBER}}", escape(orderNumber))
                .replace("{{STATUS}}", escape(statusLabel))
                .replace("{{EXPLANATION}}", escape(explanation))
                .replace("{{URL}}", escape(trackUrl));
        return layout("Votre commande " + orderNumber + " : " + statusLabel, content);
    }

    /**
     * Everything the offer announcement shows.
     *
     * @param hasImage  whether the basket's photo travels with the message (see
     *                  {@link #BUNDLE_IMAGE_CID}); false draws the woven band instead
     * @param wasPrice  what the components come to separately, struck through - the whole
     *                  point of a basket is the gap between the two figures
     * @param itemsHtml the product grid, from {@link #bundleItemGrid}
     * @param audience  the trade this basket is priced for, named so the reader knows the
     *                  offer is theirs and not a mailshot
     */
    public record BundleOffer(String name, String description, boolean hasImage,
                              String price, String wasPrice, String savings, int savingsPercent,
                              String itemsHtml, int itemCount, String audience, String url) {
    }

    /**
     * A new basket, announced to its customers.
     *
     * Laid out the way a shop announces a promotion, because that is what it is: the basket's
     * photo runs edge to edge at the top, a band carries its name and what it saves, and the
     * contents follow as product cards - each with its picture, what customers think of it and
     * what it costs this trade. The two prices sit together at the bottom, so the saving is
     * read rather than claimed.
     */
    public static String bundleAnnouncementEmail(BundleOffer offer) {
        String banner = offer.hasImage()
                ? """
                  <tr><td style="font-size:0;line-height:0;background:#ffffff;">
                    <img src="cid:{{CID}}" alt="{{NAME}}" width="600"
                         style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;text-decoration:none;">
                  </td></tr>
                  """.replace("{{CID}}", BUNDLE_IMAGE_CID).replace("{{NAME}}", escape(offer.name()))
                // No photo: a woven emerald band rather than a broken picture or a blank gap.
                // Repeating a character across a coloured strip is the only "texture" every
                // client renders, and it reads as a basket's weave at a glance.
                : """
                  <tr><td align="center" style="background:#047857;padding:30px 24px 26px;">
                    <p style="margin:0;font-size:15px;letter-spacing:7px;color:#6ee7b7;">&#9587;&#9587;&#9587;&#9587;&#9587;&#9587;&#9587;&#9587;&#9587;&#9587;&#9587;&#9587;</p>
                    <p style="margin:14px 0 0;font-size:11px;letter-spacing:3px;color:#a7f3d0;font-weight:700;">PANIER MARKET FOOD</p>
                  </td></tr>
                  """;

        String badge = offer.savingsPercent() > 0
                ? """
                  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                    <td style="background:#dc2626;border-radius:6px;padding:7px 12px;font-size:16px;font-weight:800;color:#ffffff;">&minus;{{PCT}}%</td>
                  </tr></table>
                  """.replace("{{PCT}}", String.valueOf(offer.savingsPercent()))
                : "";

        String wasRow = offer.wasPrice() == null || offer.wasPrice().isBlank()
                ? ""
                : """
                  <p style="margin:0 0 3px;font-size:12px;color:#9ca3af;">
                    Achet&eacute;s s&eacute;par&eacute;ment&nbsp;: <span style="text-decoration:line-through;">{{WAS}}</span>
                  </p>
                  """.replace("{{WAS}}", escape(offer.wasPrice()));

        String savingsRow = offer.savings() == null || offer.savings().isBlank()
                ? ""
                : """
                  <tr><td style="padding:0 20px 18px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td align="center" style="background:#ecfdf5;border-radius:8px;padding:10px;font-size:14px;font-weight:800;color:#047857;">{{SAVINGS}}</td>
                    </tr></table>
                  </td></tr>
                  """.replace("{{SAVINGS}}", escape(offer.savings()));

        String audienceNote = offer.audience() == null || offer.audience().isBlank()
                ? ""
                : "Offre r&eacute;serv&eacute;e aux professionnels&nbsp;: "
                        + "<strong style=\"color:#4b5563;\">" + escape(offer.audience())
                        + "</strong>.<br>";

        String rows = ("""
                {{BANNER}}

                <tr><td style="background:#065f46;padding:20px 28px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                    <td>
                      <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#6ee7b7;font-weight:700;">Nouveau panier</p>
                      <p style="margin:0;font-size:20px;line-height:26px;color:#ffffff;font-weight:800;">{{NAME}}</p>
                    </td>
                    <td align="right" style="vertical-align:middle;">{{BADGE}}</td>
                  </tr></table>
                </td></tr>

                <tr><td style="background:#ffffff;padding:26px 28px 32px;">

                  <p style="margin:0 0 22px;font-size:14px;line-height:22px;color:#6b7280;text-align:center;">{{DESCRIPTION}}</p>

                  <p style="margin:0 0 16px;font-size:16px;font-weight:800;color:#111827;text-align:center;">
                    Ce que contient le panier &#128071;
                  </p>

                  {{GRID}}

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                         style="margin-top:26px;border:2px solid #047857;border-radius:12px;">
                    <tr><td style="padding:18px 20px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                        <td style="vertical-align:bottom;">
                          {{WAS}}
                          <p style="margin:0;font-size:14px;font-weight:700;color:#111827;">Prix du panier &middot; {{COUNT}}</p>
                        </td>
                        <td align="right" style="vertical-align:bottom;">
                          <p style="margin:0;font-size:30px;line-height:32px;font-weight:800;color:#047857;">{{PRICE}}</p>
                        </td>
                      </tr></table>
                    </td></tr>
                    {{SAVINGS_ROW}}
                  </table>

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr><td align="center">
                    <a href="{{URL}}" style="display:block;background:#10b981;color:#ffffff;text-decoration:none;font-weight:800;font-size:16px;padding:16px 24px;border-radius:12px;text-align:center;">Commander ce panier</a>
                  </td></tr></table>

                  <p style="margin:20px 0 0;font-size:11px;line-height:18px;color:#9ca3af;text-align:center;">
                    {{AUDIENCE_NOTE}}Prix valable dans la limite des stocks. La remise s'applique
                    automatiquement d&egrave;s que votre panier contient tous les articles ci-dessus.
                  </p>

                </td></tr>
                """)
                .replace("{{BANNER}}", banner)
                .replace("{{NAME}}", escape(offer.name()))
                .replace("{{BADGE}}", badge)
                .replace("{{DESCRIPTION}}", escape(offer.description()))
                .replace("{{GRID}}", offer.itemsHtml())
                .replace("{{WAS}}", wasRow)
                .replace("{{COUNT}}", offer.itemCount() <= 1
                        ? offer.itemCount() + " article" : offer.itemCount() + " articles")
                .replace("{{PRICE}}", escape(offer.price()))
                .replace("{{SAVINGS_ROW}}", savingsRow)
                .replace("{{AUDIENCE_NOTE}}", audienceNote)
                .replace("{{URL}}", escape(offer.url()));

        String preheader = offer.savings() == null || offer.savings().isBlank()
                ? "Nouveau panier Market Food : " + offer.name()
                : offer.name() + " - " + offer.savings();
        return layoutOpen(preheader, rows);
    }

    /** The {@code cid:} of the picture for the component at {@code index}. */
    public static String productImageCid(int index) {
        return "productImage" + index;
    }

    /** How many product cards sit on one row. Three fit the 536px the shell leaves. */
    private static final int CARDS_PER_ROW = 3;

    /**
     * One product as the announcement shows it.
     *
     * @param imageCid the picture carried with the message, or null for the lettered tile
     * @param rating   average of approved reviews; {@code reviews} 0 means none exist yet, and
     *                 the card says so in words rather than drawing five empty stars
     */
    public record OfferItem(String name, String unit, int quantity, String unitPrice,
                            String lineTotal, String imageCid, double rating, long reviews) {
    }

    /**
     * The basket's contents, as a grid of product cards.
     *
     * Three to a row, each a small product card the way a shop lists them - photo, name,
     * rating, what one costs and what this basket's quantity of it comes to. The last row is
     * padded with empty cells so the cards keep their width instead of stretching to fill it.
     */
    public static String bundleItemGrid(List<OfferItem> items) {
        if (items == null || items.isEmpty()) {
            return "";
        }
        StringBuilder grid = new StringBuilder();
        for (int start = 0; start < items.size(); start += CARDS_PER_ROW) {
            grid.append(start == 0
                    ? "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr>"
                    : "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin-top:12px;\"><tr>");

            for (int column = 0; column < CARDS_PER_ROW; column++) {
                if (column > 0) {
                    grid.append("<td class=\"gap\" width=\"2%\" style=\"width:2%;font-size:0;line-height:0;\">&nbsp;</td>");
                }
                int index = start + column;
                grid.append(index < items.size()
                        ? productCard(items.get(index), index)
                        // An empty cell, still 32% wide: without it a lone card on the last
                        // row would stretch across the whole width.
                        : "<td class=\"gap\" width=\"32%\" style=\"width:32%;\">&nbsp;</td>");
            }
            grid.append("</tr></table>");
        }
        return grid.toString();
    }

    private static String productCard(OfferItem item, int index) {
        String safeName = escape(item.name());
        String picture = item.imageCid() != null
                ? """
                  <img src="cid:{{CID}}" alt="{{NAME}}" width="120" height="120"
                       style="display:block;width:120px;height:120px;border:0;border-radius:6px;">
                  """.replace("{{CID}}", item.imageCid()).replace("{{NAME}}", safeName)
                : """
                  <table role="presentation" cellpadding="0" cellspacing="0" width="120" style="width:120px;height:120px;background:#ecfdf5;border-radius:8px;"><tr>
                    <td align="center" style="height:120px;font-size:40px;font-weight:800;color:#059669;">{{INITIAL}}</td>
                  </tr></table>
                  """.replace("{{INITIAL}}", initial(item.name()));

        String unitRow = item.unit() == null || item.unit().isBlank() ? ""
                : "<tr><td style=\"padding:0 10px 2px;font-size:11px;color:#9ca3af;\">"
                        + escape(item.unit()) + "</td></tr>";

        String unitPriceRow = item.unitPrice() == null || item.unitPrice().isBlank() ? ""
                : "<tr><td style=\"padding:0 10px 4px;font-size:11px;color:#9ca3af;\">"
                        + escape(item.unitPrice()) + " l'unit&eacute;</td></tr>";

        return ("""
                <td class="col" width="32%" style="width:32%;vertical-align:top;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                         style="border:1px solid #e5e7eb;border-radius:10px;background:#ffffff;">
                    <tr><td style="padding:8px 8px 0;">
                      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                        <td style="background:#047857;border-radius:5px;padding:4px 8px;font-size:11px;font-weight:800;color:#ffffff;">&times;{{QTY}}</td>
                      </tr></table>
                    </td></tr>
                    <tr><td align="center" style="padding:8px 10px 6px;">{{PICTURE}}</td></tr>
                    <tr><td style="padding:0 10px 4px;font-size:12px;line-height:17px;font-weight:700;color:#111827;">{{NAME}}</td></tr>
                    {{STARS}}
                    {{UNIT}}
                    {{UNIT_PRICE}}
                    <tr><td style="padding:0 10px 12px;font-size:15px;font-weight:800;color:#047857;">{{TOTAL}}</td></tr>
                  </table>
                </td>
                """)
                .replace("{{QTY}}", String.valueOf(item.quantity()))
                .replace("{{PICTURE}}", picture)
                .replace("{{NAME}}", safeName)
                .replace("{{STARS}}", stars(item.rating(), item.reviews()))
                .replace("{{UNIT}}", unitRow)
                .replace("{{UNIT_PRICE}}", unitPriceRow)
                .replace("{{TOTAL}}", escape(item.lineTotal()));
    }

    /**
     * The rating line: filled stars, then the average and how many opinions it rests on.
     *
     * Rounded to whole stars with the figure written beside it, because half-star glyphs are
     * not rendered consistently and an image per half-star is not worth its weight. A product
     * nobody has reviewed says so, rather than showing five grey stars that read as "rated 0".
     */
    private static String stars(double rating, long reviews) {
        if (reviews <= 0) {
            return "<tr><td style=\"padding:0 10px 5px;font-size:11px;color:#9ca3af;\">"
                    + "Pas encore d'avis</td></tr>";
        }
        int filled = (int) Math.round(Math.min(5, Math.max(0, rating)));
        StringBuilder drawn = new StringBuilder();
        for (int i = 0; i < 5; i++) {
            drawn.append("<span style=\"color:")
                    .append(i < filled ? "#f59e0b" : "#d1d5db")
                    .append(";\">&#9733;</span>");
        }
        return ("""
                <tr><td style="padding:0 10px 5px;font-size:13px;line-height:16px;">
                  {{STARS}}<span style="font-size:11px;color:#6b7280;">&nbsp;{{AVG}} ({{COUNT}})</span>
                </td></tr>
                """)
                .replace("{{STARS}}", drawn.toString())
                .replace("{{AVG}}", String.format(java.util.Locale.FRANCE, "%.1f", rating))
                .replace("{{COUNT}}", String.valueOf(reviews));
    }

    /** First letter of a product's name, for the tile that stands in for a missing photo. */
    private static String initial(String name) {
        String trimmed = name == null ? "" : name.trim();
        return trimmed.isEmpty() ? "&middot;"
                : escape(trimmed.substring(0, 1).toUpperCase(java.util.Locale.ROOT));
    }

    /**
     * A back-office alert (new order, low stock) mirrored to staff by e-mail, so something
     * happening at 2am is not waiting unseen in a browser tab nobody has open.
     */
    public static String staffAlertEmail(String title, String message, String actionUrl) {
        String content = ("""
                <p style="margin:0 0 6px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Back-office</p>
                <h1 style="margin:0 0 10px;font-size:20px;color:#111827;">{{TITLE}}</h1>
                <p style="margin:0 0 26px;font-size:14px;line-height:22px;color:#374151;">{{MESSAGE}}</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
                  <a href="{{URL}}" style="display:inline-block;background:#1f2937;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 34px;border-radius:10px;">Ouvrir le back-office</a>
                </td></tr></table>
                """)
                .replace("{{TITLE}}", escape(title))
                .replace("{{MESSAGE}}", escape(message))
                .replace("{{URL}}", escape(actionUrl));
        return layout(title, content);
    }

    /** A trade account has been opened: the applicant may now sign in and see their prices. */
    public static String accountApprovedEmail(String shopName, String segment, String loginUrl) {
        String segmentLine = segment == null || segment.isBlank()
                ? ""
                : "<p style=\"margin:0 0 26px;font-size:14px;line-height:22px;color:#374151;\">"
                + "Vos tarifs sont ceux de la catégorie <strong>" + escape(segment)
                + "</strong>.</p>";
        String content = ("""
                <p style="margin:0 0 6px;font-size:12px;color:#059669;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Compte activé</p>
                <h1 style="margin:0 0 10px;font-size:20px;color:#111827;">Bienvenue, {{SHOP}}</h1>
                <p style="margin:0 0 18px;font-size:14px;line-height:22px;color:#374151;">Votre compte professionnel est validé. Vous pouvez vous connecter et passer commande.</p>
                {{SEGMENT}}
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
                  <a href="{{URL}}" style="display:inline-block;background:#047857;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 34px;border-radius:10px;">Se connecter</a>
                </td></tr></table>
                """)
                .replace("{{SHOP}}", escape(shopName))
                .replace("{{SEGMENT}}", segmentLine)
                .replace("{{URL}}", escape(loginUrl));
        return layout("Votre compte Market Food est activé", content);
    }

    /**
     * An application was turned down.
     *
     * The reason is shown rather than softened away: an applicant who is not told why has no
     * way to fix anything, and calls instead.
     */
    public static String accountRejectedEmail(String shopName, String reason) {
        String content = ("""
                <p style="margin:0 0 6px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Demande de compte</p>
                <h1 style="margin:0 0 10px;font-size:20px;color:#111827;">Bonjour {{SHOP}}</h1>
                <p style="margin:0 0 18px;font-size:14px;line-height:22px;color:#374151;">Votre demande de compte n'a pas pu être acceptée.</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;"><tr><td style="background:#f9fafb;border-left:3px solid #d1d5db;padding:14px 16px;font-size:14px;line-height:22px;color:#374151;">{{REASON}}</td></tr></table>
                <p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">Si vous pensez qu'il s'agit d'une erreur, répondez simplement à cet e-mail.</p>
                """)
                .replace("{{SHOP}}", escape(shopName))
                .replace("{{REASON}}", escape(reason));
        return layout("Votre demande de compte Market Food", content);
    }

    /**
     * The six-digit code that lets a customer set a new password.
     *
     * Set large and widely spaced because it is read on one screen and typed into another,
     * usually on a phone - a run of six tight digits is exactly where a 6 becomes an 8. The
     * closing reassurance earns its place too: most people who receive one of these
     * unexpectedly want to know whether they have to do anything about it.
     */
    public static String passwordResetEmail(String shopName, String code) {
        String content = ("""
                <p style="margin:0 0 6px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Mot de passe oublié</p>
                <h1 style="margin:0 0 10px;font-size:20px;color:#111827;">Bonjour {{SHOP}}</h1>
                <p style="margin:0 0 22px;font-size:14px;line-height:22px;color:#374151;">Voici votre code de réinitialisation. Saisissez-le sur la page ouverte dans votre navigateur.</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;"><tr><td align="center">
                  <div style="display:inline-block;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:18px 34px;font-family:'Courier New',monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:#047857;">{{CODE}}</div>
                </td></tr></table>
                <p style="margin:0 0 6px;font-size:14px;line-height:22px;color:#374151;">Ce code est valable <strong>15 minutes</strong>.</p>
                <p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">Vous n'avez rien demandé ? Ignorez cet e-mail : votre mot de passe reste inchangé.</p>
                """)
                .replace("{{SHOP}}", escape(shopName))
                .replace("{{CODE}}", escape(code));
        return layout("Votre code de réinitialisation Market Food", content);
    }

    /** Minimal HTML escaping for values interpolated into the templates. */
    private static String escape(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
