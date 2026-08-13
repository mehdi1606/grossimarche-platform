package com.grossimarche;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

/**
 * Boots the full application context against real Postgres and Redis containers, proving
 * the layered scaffold wires together: datasource, JPA (ddl-auto=validate), Flyway,
 * Redis, security and the web layer all start cleanly.
 */
@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class GrossimarcheApplicationTests {

    @Test
    void contextLoads() {
        // A failure to start the context fails this test.
    }
}
