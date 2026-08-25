package com.grossimarche.integration.email;

import com.grossimarche.config.AsyncConfig;
import com.grossimarche.config.OtpProperties;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Transactional e-mail: staff invitations, order-status updates, offer announcements and
 * back-office alerts.
 *
 * Separate from {@link com.grossimarche.integration.OtpSender} because that interface is shaped
 * around "deliver this code over this channel"; these are full messages with a subject and a
 * body.
 *
 * Mail is optional. Spring Boot only auto-configures a {@link JavaMailSender} when
 * {@code spring.mail.host} is set, so on a machine with no SMTP relay this logs a warning and
 * reports that nothing was sent - for a staff invitation the caller then shows the password to
 * the admin instead of it vanishing.
 *
 * Notifications and announcements go out on the mail executor: a status change must never make
 * a customer wait, and a mailshot must never hold a request open. The staff invitation stays
 * synchronous because its caller has to know whether it arrived.
 */
@Component
public class Mailer {

    private static final Logger log = LoggerFactory.getLogger(Mailer.class);

    private final ObjectProvider<JavaMailSender> mailSender;
    private final String from;
    private final String fromName;
    private final String adminUrl;
    private final String storeUrl;

    public Mailer(ObjectProvider<JavaMailSender> mailSender, OtpProperties props,
                  @Value("${spring.mail.username:}") String mailUsername,
                  @Value("${grossimarche.admin-url:http://localhost:4100}") String adminUrl,
                  @Value("${grossimarche.store-url:http://localhost:3000}") String storeUrl) {
        this.mailSender = mailSender;
        OtpProperties.Email email = props.email();
        String configuredFrom = email == null ? null : email.from();
        this.from = StringUtils.hasText(configuredFrom) ? configuredFrom : mailUsername;
        this.fromName = (email == null || !StringUtils.hasText(email.fromName()))
                ? "Grossimarché" : email.fromName();
        this.adminUrl = adminUrl;
        this.storeUrl = storeUrl;
    }

    public String storeUrl() {
        return storeUrl;
    }

    public String adminUrl() {
        return adminUrl;
    }

    /**
     * Send the credentials for a newly created staff account.
     *
     * Synchronous, unlike every other message here: the caller has to tell the admin whether
     * the password reached its recipient or has to be read off the screen.
     *
     * @return whether the message actually went out; {@code false} means mail is not configured
     *         and the caller must hand the password over another way.
     */
    public boolean sendStaffInvite(String to, String fullName, String password) {
        String plain = """
                Un compte back-office Grossimarché vient d'être créé pour vous.

                Identifiant : %s
                Mot de passe provisoire : %s

                Connexion : %s

                Ce mot de passe est provisoire : il vous sera demandé d'en choisir un nouveau
                à votre première connexion. Ne le transmettez à personne.
                """.formatted(to, password, adminUrl);
        return send(to, "Votre accès au back-office Grossimarché", plain,
                EmailTemplates.staffInviteEmail(fullName, to, password, adminUrl));
    }

    /**
     * Send one message. Returns whether it went out, so callers that care can react; those that
     * do not can ignore it - a failed notification must never break the action that triggered it.
     */
    public boolean send(String to, String subject, String plainBody, String htmlBody) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null || !StringUtils.hasText(from) || !StringUtils.hasText(to)) {
            log.warn("SMTP is not configured; the e-mail '{}' to {} was not sent.",
                    subject, mask(to));
            return false;
        }
        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true,
                    StandardCharsets.UTF_8.name());
            helper.setFrom(new InternetAddress(from, fromName, StandardCharsets.UTF_8.name()));
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(plainBody, htmlBody);
            sender.send(message);
            return true;
        } catch (Exception e) {
            log.error("Could not send e-mail to {}", mask(to), e);
            return false;
        }
    }

    /** Fire-and-forget variant for notifications, run on the mail executor. */
    @Async(AsyncConfig.MAIL_EXECUTOR)
    public void sendAsync(String to, String subject, String plainBody, String htmlBody) {
        send(to, subject, plainBody, htmlBody);
    }

    /**
     * The same message to many recipients, one at a time on the mail executor.
     *
     * Each address gets its own message rather than one message with everyone in BCC: a relay
     * that rejects one address must not silently drop the rest, and customers must never be
     * able to see each other's addresses.
     */
    @Async(AsyncConfig.MAIL_EXECUTOR)
    public void broadcast(List<String> recipients, String subject, String plainBody,
                          String htmlBody) {
        if (recipients == null || recipients.isEmpty()) {
            return;
        }
        int sent = 0;
        for (String to : recipients) {
            if (send(to, subject, plainBody, htmlBody)) {
                sent++;
            }
        }
        log.info("Broadcast '{}' delivered to {}/{} recipients.", subject, sent, recipients.size());
    }

    private String mask(String email) {
        if (!StringUtils.hasText(email)) {
            return "(unknown)";
        }
        int at = email.indexOf('@');
        return at <= 1 ? "***" : email.charAt(0) + "***" + email.substring(at);
    }
}
