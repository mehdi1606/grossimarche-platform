package com.grossimarche.integration.push;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.AndroidConfig;
import com.google.firebase.messaging.AndroidNotification;
import com.google.firebase.messaging.ApnsConfig;
import com.google.firebase.messaging.Aps;
import com.google.firebase.messaging.BatchResponse;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.MessagingErrorCode;
import com.google.firebase.messaging.MulticastMessage;
import com.google.firebase.messaging.Notification;
import com.google.firebase.messaging.SendResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Delivers notifications through Firebase Cloud Messaging.
 *
 * Built only when {@code FIREBASE_CREDENTIALS} holds a service-account key (see
 * {@link PushConfig}); without it the logging sender takes over and the platform runs
 * unchanged. The key is read from the environment rather than a file in the image, for the
 * same reason the SMTP password is: a credential committed to this repository has already
 * been revoked once by its provider.
 *
 * Both a notification and a data payload are sent. The notification is what the system shows
 * when the app is closed; the data is what the app reads to open the right screen rather than
 * the home page.
 */
class FirebasePushSender implements PushSender {

    private static final Logger log = LoggerFactory.getLogger(FirebasePushSender.class);

    /** Firebase refuses more than this many tokens in one call. */
    private static final int BATCH_LIMIT = 500;

    private static final String APP_NAME = "market-food";

    private final String credentials;
    private FirebaseMessaging messaging;

    FirebasePushSender(String credentials) {
        this.credentials = credentials;
        connect();
    }

    /**
     * The key may be given as raw JSON or base64-encoded. Base64 exists because a JSON blob
     * with newlines inside an environment variable survives neither docker-compose nor a shell
     * export intact, and the resulting failure looks like a bad key rather than a mangled one.
     */
    private void connect() {
        try {
            byte[] json = credentials.trim().startsWith("{")
                    ? credentials.getBytes(StandardCharsets.UTF_8)
                    : Base64.getDecoder().decode(credentials.trim());

            FirebaseApp app = FirebaseApp.getApps().stream()
                    .filter(existing -> APP_NAME.equals(existing.getName()))
                    .findFirst()
                    .orElseGet(() -> FirebaseApp.initializeApp(FirebaseOptions.builder()
                            .setCredentials(readCredentials(json))
                            .build(), APP_NAME));

            this.messaging = FirebaseMessaging.getInstance(app);
            log.info("Firebase push is configured; notifications will be delivered.");
        } catch (Exception e) {
            // Never fatal: a bad key must not stop the shop from taking orders. The platform
            // falls back to sending nothing, and says so on every attempt.
            log.error("Firebase credentials could not be read; push notifications are disabled.", e);
        }
    }

    private static GoogleCredentials readCredentials(byte[] json) {
        try {
            return GoogleCredentials.fromStream(new ByteArrayInputStream(json));
        } catch (Exception e) {
            throw new IllegalStateException("Invalid Firebase service-account key", e);
        }
    }

    @Override
    public List<String> send(List<String> tokens, String title, String body,
                             Map<String, String> data) {
        if (messaging == null || tokens == null || tokens.isEmpty()) {
            if (messaging == null && tokens != null && !tokens.isEmpty()) {
                log.warn("Push '{}' not sent to {} device(s): Firebase is not connected.",
                        title, tokens.size());
            }
            return List.of();
        }

        List<String> dead = new ArrayList<>();
        int sent = 0;
        for (int from = 0; from < tokens.size(); from += BATCH_LIMIT) {
            List<String> slice = tokens.subList(from, Math.min(from + BATCH_LIMIT, tokens.size()));
            sent += deliver(slice, title, body, data, dead);
        }
        log.info("Push '{}' delivered to {}/{} device(s), {} stale token(s) dropped.",
                title, sent, tokens.size(), dead.size());
        return dead;
    }

    private int deliver(List<String> slice, String title, String body,
                        Map<String, String> data, List<String> dead) {
        MulticastMessage message = MulticastMessage.builder()
                .addAllTokens(slice)
                .setNotification(Notification.builder().setTitle(title).setBody(body).build())
                .putAllData(data == null ? Map.of() : data)
                // High priority so a phone asleep in a pocket still rings: an order moving is
                // worth waking for, and Android holds normal-priority messages back.
                .setAndroidConfig(AndroidConfig.builder()
                        .setPriority(AndroidConfig.Priority.HIGH)
                        .setNotification(AndroidNotification.builder()
                                .setSound("default")
                                .build())
                        .build())
                .setApnsConfig(ApnsConfig.builder()
                        .setAps(Aps.builder().setSound("default").build())
                        .build())
                .build();

        try {
            BatchResponse response = messaging.sendEachForMulticast(message);
            for (int i = 0; i < response.getResponses().size(); i++) {
                SendResponse one = response.getResponses().get(i);
                if (!one.isSuccessful() && isGone(one)) {
                    dead.add(slice.get(i));
                }
            }
            return response.getSuccessCount();
        } catch (Exception e) {
            // A delivery failure must never break the action that triggered it - the order was
            // still placed, the offer still published.
            log.error("Push batch of {} device(s) failed", slice.size(), e);
            return 0;
        }
    }

    /** True when Firebase says this device will never be reachable again, not merely now. */
    private static boolean isGone(SendResponse response) {
        if (response.getException() == null) {
            return false;
        }
        MessagingErrorCode code = response.getException().getMessagingErrorCode();
        return code == MessagingErrorCode.UNREGISTERED || code == MessagingErrorCode.INVALID_ARGUMENT;
    }
}
