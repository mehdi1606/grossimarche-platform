package com.grossimarche.security;

import com.grossimarche.config.JwtProperties;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

/**
 * Holds the RS256 key material used to sign and verify access tokens.
 *
 * <p><strong>Why RS256, not HS256:</strong> with an asymmetric key pair the private
 * signing key never leaves this server; anything that only needs to <em>verify</em> a
 * token (a gateway, a future mobile BFF, another service) needs the public key alone, and
 * a leaked public key is harmless. An HS256 shared secret, by contrast, is enough to
 * <em>forge</em> tokens, so it must be distributed to every verifier — a far larger blast
 * radius. The {@code kid} header lets us publish several verification keys at once and
 * rotate the signing key without downtime.
 *
 * <p>The key pair is read from {@link JwtProperties} (PEM from env). If none is configured
 * and {@code allowEphemeralKey} is true (local/test only), a throwaway pair is generated
 * and a warning logged. In any other profile a missing key fails startup immediately.
 */
@Component
public class JwtKeyProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtKeyProvider.class);

    private final RSAKey signingKey;
    private final JWKSource<SecurityContext> jwkSource;

    public JwtKeyProvider(JwtProperties props) {
        this.signingKey = resolveSigningKey(props);
        // The JWK set is the source of verification keys; add more here to rotate.
        this.jwkSource = new ImmutableJWKSet<>(new JWKSet(signingKey));
    }

    /** The {@code kid} of the current signing key, written into every token header. */
    public String signingKeyId() {
        return signingKey.getKeyID();
    }

    /** Verification key source, used to build both the encoder and the decoder. */
    public JWKSource<SecurityContext> jwkSource() {
        return jwkSource;
    }

    private RSAKey resolveSigningKey(JwtProperties props) {
        boolean hasPem = StringUtils.hasText(props.privateKeyPem())
                && StringUtils.hasText(props.publicKeyPem());
        if (hasPem) {
            try {
                RSAPublicKey publicKey = parsePublicKey(props.publicKeyPem());
                RSAPrivateKey privateKey = parsePrivateKey(props.privateKeyPem());
                return new RSAKey.Builder(publicKey).privateKey(privateKey)
                        .keyID(props.keyId()).build();
            } catch (Exception e) {
                throw new IllegalStateException("Failed to load the RS256 JWT key pair from "
                        + "JWT_PRIVATE_KEY / JWT_PUBLIC_KEY", e);
            }
        }
        if (!props.allowEphemeralKey()) {
            throw new IllegalStateException("No JWT RS256 key configured. Set JWT_PRIVATE_KEY "
                    + "and JWT_PUBLIC_KEY (PEM). Ephemeral keys are permitted only in the "
                    + "local/test profiles.");
        }
        log.warn("No JWT key configured — generating an EPHEMERAL RS256 key pair. Tokens will "
                + "not survive a restart. Never rely on this outside local/test.");
        return generateEphemeralKey(props.keyId());
    }

    private static RSAKey generateEphemeralKey(String keyId) {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            KeyPair pair = generator.generateKeyPair();
            return new RSAKey.Builder((RSAPublicKey) pair.getPublic())
                    .privateKey((RSAPrivateKey) pair.getPrivate())
                    .keyID(keyId)
                    .build();
        } catch (Exception e) {
            throw new IllegalStateException("Could not generate an ephemeral RSA key", e);
        }
    }

    private static RSAPublicKey parsePublicKey(String pem) throws Exception {
        byte[] der = decodePem(pem, "PUBLIC KEY");
        return (RSAPublicKey) KeyFactory.getInstance("RSA")
                .generatePublic(new X509EncodedKeySpec(der));
    }

    private static RSAPrivateKey parsePrivateKey(String pem) throws Exception {
        byte[] der = decodePem(pem, "PRIVATE KEY");
        return (RSAPrivateKey) KeyFactory.getInstance("RSA")
                .generatePrivate(new PKCS8EncodedKeySpec(der));
    }

    private static byte[] decodePem(String pem, String type) {
        String normalized = pem
                .replace("-----BEGIN " + type + "-----", "")
                .replace("-----END " + type + "-----", "")
                .replaceAll("\\s", "");
        return Base64.getDecoder().decode(normalized);
    }
}
