package com.grossimarche.security;

import com.grossimarche.TestcontainersConfiguration;
import com.grossimarche.entity.enums.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies the back-office authorization split enforced by {@link SecurityConfig}, exercised
 * over real HTTP with real JWTs. A STORE_MANAGER is limited to the core store operations
 * (orders, products, categories, customers, …); ADMIN also owns the exclusive areas - staff,
 * coupons, settings (stores) and the currency/language configuration.
 *
 * <p>Tokens are minted directly by {@link JwtService}; the JWT filter builds the principal
 * from the token claims with no DB lookup, so no seeded staff user is required. The JDK
 * HttpClient is used to stay independent of Spring Boot's (moving) test HTTP helper modules.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class AdminRbacTest {

    @Value("${local.server.port}")
    int port;

    @Autowired
    JwtService jwtService;

    private final HttpClient http = HttpClient.newHttpClient();

    // ---- Store manager: denied on ADMIN-exclusive areas -------------------------------

    @Test
    void storeManager_isDeniedAdminExclusiveAreas() {
        assertThat(getStatus("/api/v1/admin/staff", Role.STORE_MANAGER)).isEqualTo(403);
        assertThat(getStatus("/api/v1/admin/coupons", Role.STORE_MANAGER)).isEqualTo(403);
        assertThat(postEmptyStatus("/api/v1/admin/coupons", Role.STORE_MANAGER)).isEqualTo(403);
        assertThat(postEmptyStatus("/api/v1/admin/stores", Role.STORE_MANAGER)).isEqualTo(403);
        assertThat(getStatus("/api/v1/admin/currencies", Role.STORE_MANAGER)).isEqualTo(403);
        assertThat(getStatus("/api/v1/admin/languages", Role.STORE_MANAGER)).isEqualTo(403);
    }

    // ---- Store manager: allowed on core store operations ------------------------------

    @Test
    void storeManager_isAllowedCoreOperations() {
        assertThat(getStatus("/api/v1/admin/orders", Role.STORE_MANAGER)).isEqualTo(200);
        assertThat(getStatus("/api/v1/admin/customers", Role.STORE_MANAGER)).isEqualTo(200);
        assertThat(getStatus("/api/v1/admin/dashboard/summary", Role.STORE_MANAGER)).isEqualTo(200);
        assertThat(getStatus("/api/v1/admin/attributes", Role.STORE_MANAGER)).isEqualTo(200);
        assertThat(getStatus("/api/v1/admin/notifications", Role.STORE_MANAGER)).isEqualTo(200);
    }

    // ---- Admin: allowed everywhere ----------------------------------------------------

    @Test
    void admin_isAllowedExclusiveAndCore() {
        assertThat(getStatus("/api/v1/admin/staff", Role.ADMIN)).isEqualTo(200);
        assertThat(getStatus("/api/v1/admin/coupons", Role.ADMIN)).isEqualTo(200);
        assertThat(getStatus("/api/v1/admin/currencies", Role.ADMIN)).isEqualTo(200);
        assertThat(getStatus("/api/v1/admin/languages", Role.ADMIN)).isEqualTo(200);
        assertThat(getStatus("/api/v1/admin/orders", Role.ADMIN)).isEqualTo(200);
    }

    // ---- Public + anonymous -----------------------------------------------------------

    @Test
    void publicConfigReads_areOpen_butAdminIsProtected() {
        assertThat(getStatus("/api/v1/currencies", null)).isEqualTo(200);
        assertThat(getStatus("/api/v1/languages", null)).isEqualTo(200);
        assertThat(getStatus("/api/v1/admin/orders", null)).isEqualTo(401);
    }

    // ---- helpers ----------------------------------------------------------------------

    private int getStatus(String path, Role role) {
        return send(requestBuilder(path, role).GET().build());
    }

    private int postEmptyStatus(String path, Role role) {
        return send(requestBuilder(path, role)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{}"))
                .build());
    }

    private HttpRequest.Builder requestBuilder(String path, Role role) {
        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
        if (role != null) {
            builder.header("Authorization", "Bearer " + jwtService.issue(UUID.randomUUID(), role).value());
        }
        return builder;
    }

    private int send(HttpRequest request) {
        try {
            return http.send(request, HttpResponse.BodyHandlers.discarding()).statusCode();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
