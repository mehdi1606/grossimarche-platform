package com.grossimarche.service;

import java.util.UUID;

/**
 * A customer's application has been decided.
 *
 * Carries the id rather than the entity: the listener runs after the transaction commits, in
 * one of its own, so it must re-read the account rather than hold a detached copy of it.
 *
 * @param userId   the applicant
 * @param approved whether they may now trade
 * @param reason   why they were turned down; null on approval
 */
public record CustomerDecisionEvent(UUID userId, boolean approved, String reason) {
}
