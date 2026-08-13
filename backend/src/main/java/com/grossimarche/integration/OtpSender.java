package com.grossimarche.integration;

import com.grossimarche.entity.enums.OtpChannel;

/**
 * Delivers a one-time code over a single channel. The active implementations are chosen by
 * configuration ({@code grossimarche.otp.provider}); {@link com.grossimarche.service.OtpService}
 * dispatches to the sender whose {@link #channel()} matches the request. No service imports
 * a vendor SDK — that stays behind these adapters.
 */
public interface OtpSender {

    void send(String destination, String code);

    OtpChannel channel();
}
