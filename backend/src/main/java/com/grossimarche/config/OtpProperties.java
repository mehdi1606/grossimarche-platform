package com.grossimarche.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.time.Duration;

/**
 * OTP configuration bound from {@code grossimarche.otp.*}. {@code provider} selects the
 * delivery implementation ({@code logging} for local/test, {@code live} for real
 * providers). All security-relevant tuning (TTL, attempt cap, rate limits) lives here so
 * it can be adjusted without a redeploy.
 */
@ConfigurationProperties(prefix = "grossimarche.otp")
public record OtpProperties(
        @DefaultValue("logging") String provider,
        @DefaultValue("300s") Duration ttl,
        @DefaultValue("5") int maxVerifyAttempts,
        @DefaultValue("15m") Duration blockDuration,
        @DefaultValue("3") int maxRequestsPerDestination,
        @DefaultValue("10m") Duration destinationWindow,
        @DefaultValue("20") int maxRequestsPerIp,
        @DefaultValue("10m") Duration ipWindow,
        Sms sms,
        Email email
) {

    /** Live SMS provider settings (only required when {@code provider=live}). */
    public record Sms(String baseUrl, String apiKey, @DefaultValue("Grossimarche") String senderId) {
    }

    /** Live email provider settings (only required when {@code provider=live}). */
    public record Email(String baseUrl, String apiKey,
                        @DefaultValue("no-reply@grossimarche.ma") String from,
                        @DefaultValue("Grossimarché") String fromName) {
    }
}
