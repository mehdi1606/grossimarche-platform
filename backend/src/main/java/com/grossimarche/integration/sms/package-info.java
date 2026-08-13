/**
 * SMS delivery adapters for OTP, behind an {@code OtpSender} interface. A real
 * provider-backed implementation and a {@code LoggingOtpSender} for local/test are
 * selected by configuration. No {@code service} may import a vendor SDK directly.
 *
 * <p>Implemented in prompt B4.
 */
package com.grossimarche.integration.sms;
