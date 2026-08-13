package com.grossimarche.dto.notification;

import com.grossimarche.entity.enums.NotificationType;

import java.time.Instant;
import java.util.UUID;

/** A back-office notification as returned by the API / pushed over STOMP. */
public record NotificationResponse(
        UUID id,
        NotificationType type,
        String title,
        String message,
        UUID referenceId,
        boolean read,
        Instant createdAt
) {
}
