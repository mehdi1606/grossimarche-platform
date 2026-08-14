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

    /** Minimal HTML escaping for values interpolated into the templates. */
    private static String escape(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
