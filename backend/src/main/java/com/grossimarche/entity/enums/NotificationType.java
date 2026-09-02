package com.grossimarche.entity.enums;

/**
 * Category of a back-office notification. Kept in step with the {@code ck_notification_type}
 * check constraint — a value added here without a migration is rejected at insert time.
 */
public enum NotificationType {
    NEW_ORDER,
    NEW_CUSTOMER,
    LOW_STOCK,
    SYSTEM
}
