/**
 * CMI payment gateway behind a {@code PaymentGateway} interface: a real
 * {@code CmiPaymentGateway} and a {@code MockPaymentGateway} for local/test, plus
 * callback signature verification. Credentials come from env vars only.
 *
 * <p>No card data is ever stored. Implemented in prompt B6.
 */
package com.grossimarche.integration.payment;
