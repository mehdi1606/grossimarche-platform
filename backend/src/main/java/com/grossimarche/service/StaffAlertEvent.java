package com.grossimarche.service;

/**
 * A back-office notification that also deserves an e-mail.
 *
 * Published alongside the in-app notification rather than derived from it, so the two channels
 * stay independent: a feed entry that nobody needs to be woken for simply does not publish one
 * of these.
 *
 * @param title   the alert headline
 * @param message the body, already written for a human
 * @param path    where in the back-office to go, appended to the admin URL (e.g. "/orders")
 */
public record StaffAlertEvent(String title, String message, String path) {
}
