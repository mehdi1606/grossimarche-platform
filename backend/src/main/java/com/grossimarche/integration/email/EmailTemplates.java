package com.grossimarche.integration.email;

import java.time.Year;

/**
 * Branded, email-client-safe HTML templates (table layout + inline styles, no external CSS
 * or web fonts, so Gmail / Outlook render them correctly). {@link #layout} is the shared
 * Grossimarché shell (header wordmark, emerald accent, dark footer); build new transactional
 * emails by wrapping their content with it.
 */
public final class EmailTemplates {

    private EmailTemplates() {
    }

    /** Wrap body content in the branded shell. {@code preheader} is the inbox preview line. */
    public static String layout(String preheader, String contentHtml) {
        String year = String.valueOf(Year.now().getValue());
        return ("""
                <!DOCTYPE html>
                <html lang="fr">
                <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
                <body style="margin:0;padding:0;background:#f3f4f6;">
                  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">{{PREHEADER}}</span>
                  <div style="background:#f3f4f6;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
                      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
                        <tr><td style="padding:26px 32px;background:#ffffff;border-radius:16px 16px 0 0;">
                          <span style="font-size:22px;font-weight:800;color:#111827;letter-spacing:-.5px;">Grossi<span style="color:#10b981;">march&eacute;</span></span>
                        </td></tr>
                        <tr><td style="height:4px;line-height:4px;font-size:4px;background:#10b981;">&nbsp;</td></tr>
                        <tr><td style="background:#ffffff;padding:38px 32px;">{{CONTENT}}</td></tr>
                        <tr><td style="background:#1f2937;padding:26px 32px;border-radius:0 0 16px 16px;text-align:center;">
                          <p style="margin:0;color:#ffffff;font-weight:700;font-size:15px;">Grossimarch&eacute;</p>
                          <p style="margin:6px 0 0;color:#9ca3af;font-size:12px;">March&eacute; de gros &middot; Livraison au Maroc</p>
                          <p style="margin:14px 0 0;color:#6b7280;font-size:11px;">&copy; {{YEAR}} Grossimarch&eacute;. Tous droits r&eacute;serv&eacute;s.</p>
                        </td></tr>
                      </table>
                    </td></tr></table>
                  </div>
                </body></html>
                """)
                .replace("{{PREHEADER}}", escape(preheader))
                .replace("{{CONTENT}}", contentHtml)
                .replace("{{YEAR}}", year);
    }

    /** The passwordless login-code email. */
    public static String otpEmail(String code) {
        String content = ("""
                <h1 style="margin:0 0 10px;font-size:20px;color:#111827;">Votre code de connexion</h1>
                <p style="margin:0 0 26px;font-size:14px;line-height:22px;color:#6b7280;">
                  Utilisez ce code &agrave; usage unique pour vous connecter &agrave; Grossimarch&eacute;.
                  Il expire dans 5&nbsp;minutes.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
                  <div style="display:inline-block;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:14px;padding:20px 34px;">
                    <span style="font-size:34px;font-weight:800;letter-spacing:12px;color:#059669;">{{CODE}}</span>
                  </div>
                </td></tr></table>
                <p style="margin:26px 0 0;font-size:13px;line-height:20px;color:#9ca3af;">
                  Si vous n'&ecirc;tes pas &agrave; l'origine de cette demande, ignorez cet e-mail&nbsp;&mdash;
                  votre compte reste s&eacute;curis&eacute;.
                </p>
                """).replace("{{CODE}}", escape(code));
        return layout("Votre code de connexion Grossimarché", content);
    }

    /**
     * The back-office invitation: credentials for a newly created staff account.
     *
     * The password is shown once, here, and nowhere else — it is stored only as a hash, so
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
                  Un compte vient d'&ecirc;tre cr&eacute;&eacute; pour vous sur Grossimarch&eacute;.
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
        return layout("Vos identifiants Grossimarché", content);
    }

    /**
     * Order-status update for the customer.
     *
     * The status is spelled out in the shopper's own words rather than as the enum name, and
     * the button goes to the tracking page — this e-mail exists to stop the "where is my
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
     * A new bundle offer, announced to customers. {@code itemsHtml} is built by the caller
     * because only it knows the components and their quantities.
     */
    public static String bundleAnnouncementEmail(String name, String description,
                                                 String priceLabel, String savingsLabel,
                                                 String itemsHtml, String offerUrl) {
        String content = ("""
                <p style="margin:0 0 6px;font-size:12px;color:#059669;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Nouvelle offre</p>
                <h1 style="margin:0 0 10px;font-size:22px;color:#111827;">{{NAME}}</h1>
                <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#6b7280;">{{DESCRIPTION}}</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                       style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;">
                  <tr><td style="padding:20px 24px;">
                    {{ITEMS}}
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;border-top:1px solid #e5e7eb;">
                      <tr>
                        <td style="padding-top:14px;font-size:15px;font-weight:700;color:#111827;">Prix du panier</td>
                        <td style="padding-top:14px;text-align:right;font-size:20px;font-weight:800;color:#047857;">{{PRICE}}</td>
                      </tr>
                    </table>
                    <p style="margin:10px 0 0;text-align:right;font-size:13px;font-weight:700;color:#b45309;">{{SAVINGS}}</p>
                  </td></tr>
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:26px;"><tr><td align="center">
                  <a href="{{URL}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 34px;border-radius:10px;">Voir l'offre</a>
                </td></tr></table>
                <p style="margin:26px 0 0;font-size:13px;line-height:20px;color:#9ca3af;">
                  Offre valable dans la limite des stocks disponibles.
                </p>
                """)
                .replace("{{NAME}}", escape(name))
                .replace("{{DESCRIPTION}}", escape(description))
                .replace("{{ITEMS}}", itemsHtml)
                .replace("{{PRICE}}", escape(priceLabel))
                .replace("{{SAVINGS}}", escape(savingsLabel))
                .replace("{{URL}}", escape(offerUrl));
        return layout("Nouvelle offre Grossimarché : " + name, content);
    }

    /** One component line inside {@link #bundleAnnouncementEmail}. */
    public static String bundleItemRow(String name, int quantity) {
        return ("""
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td style="padding:4px 0;font-size:14px;color:#374151;">{{NAME}}</td>
                  <td style="padding:4px 0;text-align:right;font-size:14px;color:#6b7280;">&times;{{QTY}}</td>
                </tr></table>
                """)
                .replace("{{NAME}}", escape(name))
                .replace("{{QTY}}", String.valueOf(quantity));
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

    /** Minimal HTML escaping for values interpolated into the templates. */
    private static String escape(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
