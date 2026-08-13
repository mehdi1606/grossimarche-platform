package com.grossimarche.config;

import com.grossimarche.security.JwtKeyProvider;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

/**
 * Builds the JWT encoder and decoder from the key material in {@link JwtKeyProvider}.
 * The decoder selects the verification key by {@code kid} (supporting rotation) and
 * enforces the standard timestamp checks plus the issuer.
 */
@Configuration
public class JwtConfig {

    @Bean
    public JwtEncoder jwtEncoder(JwtKeyProvider keyProvider) {
        return new NimbusJwtEncoder(keyProvider.jwkSource());
    }

    @Bean
    public JwtDecoder jwtDecoder(JwtKeyProvider keyProvider, JwtProperties props) {
        DefaultJWTProcessor<SecurityContext> processor = new DefaultJWTProcessor<>();
        processor.setJWSKeySelector(
                new JWSVerificationKeySelector<>(JWSAlgorithm.RS256, keyProvider.jwkSource()));
        NimbusJwtDecoder decoder = new NimbusJwtDecoder(processor);
        // Default validators (expiry, not-before) plus a strict issuer check.
        decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(props.issuer()));
        return decoder;
    }
}
