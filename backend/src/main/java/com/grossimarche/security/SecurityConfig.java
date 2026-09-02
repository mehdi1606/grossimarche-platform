package com.grossimarche.security;

import com.grossimarche.config.AppProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Spring Security 7 configuration (SecurityFilterChain bean style - the old
 * WebSecurityConfigurerAdapter does not exist). The API is stateless and cookie-free:
 * every request authenticates with a bearer JWT via {@link JwtAuthenticationFilter}.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity   // enables @PreAuthorize on admin service methods (defence in depth)
public class SecurityConfig {

    private static final String[] SWAGGER_PATHS = {
            "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/v3/api-docs.yaml"
    };

    private final AppProperties appProperties;
    private final Environment environment;
    private final JwtService jwtService;
    private final TokenDenylistService denylistService;
    private final RestAuthenticationEntryPoint authenticationEntryPoint;
    private final RestAccessDeniedHandler accessDeniedHandler;

    public SecurityConfig(AppProperties appProperties, Environment environment,
                          JwtService jwtService, TokenDenylistService denylistService,
                          RestAuthenticationEntryPoint authenticationEntryPoint,
                          RestAccessDeniedHandler accessDeniedHandler) {
        this.appProperties = appProperties;
        this.environment = environment;
        this.jwtService = jwtService;
        this.denylistService = denylistService;
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        boolean local = environment.matchesProfiles("local");

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // CSRF is disabled because the API is stateless and cookie-free: it never
                // relies on ambient browser credentials, so there is nothing for a CSRF
                // attack to ride on. Re-enable CSRF if a cookie-session flow is ever added.
                .csrf(csrf -> csrf.disable())
                .httpBasic(basic -> basic.disable())
                .formLogin(form -> form.disable())
                .logout(logout -> logout.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> {
                    // Health + k8s/Docker liveness & readiness probes are public.
                    auth.requestMatchers("/actuator/health", "/actuator/health/**").permitAll();
                    auth.requestMatchers("/api/v1/auth/**").permitAll();
                    // WebSocket handshake is public; the STOMP CONNECT frame authenticates.
                    auth.requestMatchers("/ws/**").permitAll();
                    // Public storefront translation (FR -> AR/EN) via LibreTranslate.
                    auth.requestMatchers("/api/v1/translate").permitAll();
                    auth.requestMatchers("/api/v1/payments/cmi/callback").permitAll();
                    // The public catalogue. Bundle offers belong here for the same reason the
                    // products do: an offer exists to bring people in, so it has to be visible
                    // before anyone has an account. Without this, `anyRequest().authenticated()`
                    // catches /bundles and the storefront's offers page is empty for visitors.
                    // /client-types joins them for a narrower reason: the sign-up form has to
                    // offer the segments to someone who by definition has no account yet. It
                    // returns the segment names only, never what any of them pays.
                    auth.requestMatchers(HttpMethod.GET,
                            "/api/v1/products/**", "/api/v1/categories/**", "/api/v1/stores/**",
                            "/api/v1/currencies/**", "/api/v1/languages/**", "/api/v1/attributes/**",
                            "/api/v1/bundles/**", "/api/v1/client-types",
                            // Where we deliver: a shopper needs it while filling in an
                            // address, and the list of cities served is a shop sign.
                            "/api/v1/delivery-cities")
                            .permitAll();
                    if (local) {
                        auth.requestMatchers(SWAGGER_PATHS).permitAll();
                    }
                    // ADMIN-exclusive back-office areas: staff, coupons, settings (stores) and the
                    // currency/language configuration. These matchers MUST precede the generic
                    // /admin/** rule below (first match wins). Store managers are limited to the
                    // core store operations (orders, products, categories, customers, …).
                    auth.requestMatchers(
                            "/api/v1/admin/staff/**",
                            "/api/v1/admin/coupons/**",
                            "/api/v1/admin/stores/**",
                            "/api/v1/admin/currencies/**",
                            "/api/v1/admin/languages/**",
                            // Client types cut the whole price grid: creating one decides how
                            // every product must be priced from then on. That is a commercial
                            // decision, not the daily catalogue work a store manager does.
                            "/api/v1/admin/client-types/**",
                            // Delivery rates are commercial policy, like the segments.
                            "/api/v1/admin/delivery-cities/**").hasRole("ADMIN");
                    auth.requestMatchers("/api/v1/admin/**").hasAnyRole("ADMIN", "STORE_MANAGER");
                    auth.requestMatchers("/actuator/**").hasRole("ADMIN");
                    auth.anyRequest().authenticated();
                })
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .headers(headers -> headers
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31_536_000)) // 1 year
                        .frameOptions(frame -> frame.deny())
                        .referrerPolicy(ref -> ref.policy(ReferrerPolicy.NO_REFERRER))
                        .contentSecurityPolicy(csp -> csp.policyDirectives(cspDirectives(local))))
                .addFilterBefore(
                        new JwtAuthenticationFilter(jwtService, denylistService, authenticationEntryPoint),
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /** BCrypt encoder used to hash OTP codes (not user passwords - there are none). */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // Explicit allowlist from env - never "*" in production.
        config.setAllowedOrigins(appProperties.cors().allowedOrigins());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("X-Request-Id", "Retry-After"));
        // Bearer tokens, not cookies → credentials stay off.
        config.setAllowCredentials(false);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    private String cspDirectives(boolean local) {
        // The API serves JSON only, so a strict policy is safe in production. Swagger UI
        // (local only) needs inline styles/scripts, so relax the policy there.
        return local
                ? "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; "
                + "script-src 'self' 'unsafe-inline'"
                : "default-src 'none'; frame-ancestors 'none'; object-src 'none'";
    }
}
