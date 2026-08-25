package com.grossimarche.security;

import com.grossimarche.config.JwtConfig;
import com.grossimarche.config.JwtProperties;
import com.grossimarche.entity.enums.Role;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * B3 smoke test for the RS256 token stack: issue/parse round trip, expired token rejected,
 * and a token signed with a different key rejected. Pure unit test - no Spring context.
 * The exhaustive security suite (denylist, refresh rotation, family revocation, HTTP role
 * matrix) is built in B11.
 */
class JwtServiceTest {

    private static final String ISSUER = "https://api.grossimarche.test";

    private JwtProperties props(Duration accessTtl) {
        return new JwtProperties(ISSUER, "kid-test", null, null,
                accessTtl, Duration.ofDays(30), true);
    }

    private JwtService serviceWith(JwtProperties props, JwtKeyProvider keyProvider) {
        JwtConfig config = new JwtConfig();
        JwtEncoder encoder = config.jwtEncoder(keyProvider);
        JwtDecoder decoder = config.jwtDecoder(keyProvider, props);
        return new JwtService(encoder, decoder, keyProvider, props);
    }

    @Test
    void issueThenParse_roundTrips() {
        JwtProperties props = props(Duration.ofMinutes(15));
        JwtService service = serviceWith(props, new JwtKeyProvider(props));
        UUID userId = UUID.randomUUID();

        JwtService.IssuedAccessToken issued = service.issue(userId, Role.CLIENT);
        Jwt parsed = service.parse(issued.value());

        assertThat(parsed.getSubject()).isEqualTo(userId.toString());
        assertThat(parsed.getClaimAsString(JwtService.ROLE_CLAIM)).isEqualTo("CLIENT");
        assertThat(parsed.getId()).isEqualTo(issued.jti());
        assertThat(parsed.getIssuer()).hasToString(ISSUER);
        assertThat(issued.expiresInSeconds()).isEqualTo(900);
    }

    @Test
    void expiredToken_isRejected() {
        JwtProperties props = props(Duration.ofMinutes(15));
        JwtKeyProvider keyProvider = new JwtKeyProvider(props);
        JwtConfig config = new JwtConfig();
        JwtEncoder encoder = config.jwtEncoder(keyProvider);
        JwtService service = new JwtService(encoder, config.jwtDecoder(keyProvider, props),
                keyProvider, props);

        // Hand-craft a token that expired 90s ago - beyond the decoder's 60s clock skew.
        Instant now = Instant.now();
        JwsHeader header = JwsHeader.with(SignatureAlgorithm.RS256)
                .keyId(keyProvider.signingKeyId()).build();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(ISSUER)
                .subject(UUID.randomUUID().toString())
                .issuedAt(now.minusSeconds(120))
                .expiresAt(now.minusSeconds(90))
                .id(UUID.randomUUID().toString())
                .claim(JwtService.ROLE_CLAIM, "CLIENT")
                .build();
        String expired = encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();

        assertThatThrownBy(() -> service.parse(expired))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void tokenSignedWithAnotherKey_isRejected() {
        JwtProperties props = props(Duration.ofMinutes(15));
        // Issue with one key pair...
        JwtService issuer = serviceWith(props, new JwtKeyProvider(props));
        JwtService.IssuedAccessToken issued = issuer.issue(UUID.randomUUID(), Role.CLIENT);

        // ...verify with a service that has a different key pair.
        JwtService verifier = serviceWith(props, new JwtKeyProvider(props));
        assertThatThrownBy(() -> verifier.parse(issued.value()))
                .isInstanceOf(JwtException.class);
    }
}
