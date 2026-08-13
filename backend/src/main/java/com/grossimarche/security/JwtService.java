package com.grossimarche.security;

import com.grossimarche.config.JwtProperties;
import com.grossimarche.entity.enums.Role;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

/**
 * Issues and validates short-lived RS256 access tokens. Claims: {@code sub} (user id),
 * {@code role}, {@code jti}, {@code iat}, {@code exp}, {@code iss}; the header carries the
 * {@code kid}. Validation (signature, expiry, issuer) is delegated to the configured
 * {@link JwtDecoder}; the denylist check happens in {@link JwtAuthenticationFilter}.
 */
@Service
public class JwtService {

    public static final String ROLE_CLAIM = "role";

    private final JwtEncoder encoder;
    private final JwtDecoder decoder;
    private final JwtKeyProvider keyProvider;
    private final JwtProperties props;

    public JwtService(JwtEncoder encoder, JwtDecoder decoder, JwtKeyProvider keyProvider,
                      JwtProperties props) {
        this.encoder = encoder;
        this.decoder = decoder;
        this.keyProvider = keyProvider;
        this.props = props;
    }

    /** Mint a signed access token for the given user id and role. */
    public IssuedAccessToken issue(UUID userId, Role role) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(props.accessTokenTtl());
        String jti = UUID.randomUUID().toString();

        JwsHeader header = JwsHeader.with(SignatureAlgorithm.RS256)
                .keyId(keyProvider.signingKeyId())
                .build();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(props.issuer())
                .subject(userId.toString())
                .issuedAt(now)
                .expiresAt(expiresAt)
                .id(jti)
                .claim(ROLE_CLAIM, role.name())
                .build();

        Jwt jwt = encoder.encode(JwtEncoderParameters.from(header, claims));
        return new IssuedAccessToken(jwt.getTokenValue(), props.accessTokenTtl().toSeconds(),
                jti, expiresAt);
    }

    /**
     * Validate signature, expiry and issuer, returning the decoded token.
     *
     * @throws org.springframework.security.oauth2.jwt.JwtException if the token is invalid
     */
    public Jwt parse(String token) {
        return decoder.decode(token);
    }

    /** A freshly issued access token and the metadata callers need. */
    public record IssuedAccessToken(String value, long expiresInSeconds, String jti, Instant expiresAt) {
    }
}
