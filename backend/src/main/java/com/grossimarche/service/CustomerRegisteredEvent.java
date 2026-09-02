package com.grossimarche.service;

import java.util.UUID;

/**
 * Published when a shopper creates an account. Drives the NEW_CUSTOMER back-office
 * notification, and through it the staff e-mail.
 *
 * Registration used to publish a {@link StaffAlertEvent} directly, which mailed the staff but
 * left nothing in the bell: an account waiting for approval was invisible to whoever had the
 * back-office open. Going through a domain event puts registration on the same footing as
 * orders and low stock - one listener decides what a given event owes each channel.
 */
public record CustomerRegisteredEvent(
        UUID userId,
        String businessName,
        String clientTypeName,
        String city,
        String contact,
        boolean pendingApproval
) {
}
