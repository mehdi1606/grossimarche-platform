package com.grossimarche.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.time.Duration;

/**
 * JWT configuration bound from {@code grossimarche.jwt.*}. The RS256 key pair is supplied
 * as PEM via env vars; {@code allowEphemeralKey} lets local/test profiles generate a
 * throwaway key when none is configured. In production the key must be present or startup
 * fails (see {@link com.grossimarche.security.JwtKeyProvider}).
 *
 * @param issuer          the {@code iss} claim
 * @param keyId           the {@code kid} header, so keys can rotate without downtime
 * @param privateKeyPem   RS256 private key (PKCS#8 PEM), from JWT_PRIVATE_KEY
 * @param publicKeyPem    RS256 public key (X.509 PEM), from JWT_PUBLIC_KEY
 * @param accessTokenTtl  access-token lifetime (default 15m)
 * @param refreshTokenTtl refresh-token lifetime (default 30d)
 * @param allowEphemeralKey when true and no PEM is configured, generate a dev key pair
 */
@ConfigurationProperties(prefix = "grossimarche.jwt")
public record JwtProperties(
        @DefaultValue("https://api.grossimarche.ma") String issuer,
        @DefaultValue("grossimarche-key-1") String keyId,
        String privateKeyPem,
        String publicKeyPem,
        @DefaultValue("15m") Duration accessTokenTtl,
        @DefaultValue("30d") Duration refreshTokenTtl,
        @DefaultValue("false") boolean allowEphemeralKey
) {
}
