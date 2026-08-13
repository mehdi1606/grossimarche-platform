package com.grossimarche.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI / Swagger metadata: title, version, server URL and a bearer-JWT security
 * scheme. The Swagger UI and {@code /v3/api-docs} endpoints are enabled only in the
 * {@code local} profile (see application.yml); this bean only describes the document.
 */
@Configuration
public class OpenApiConfig {

    private static final String BEARER_SCHEME = "bearerAuth";

    @Bean
    public OpenAPI grossimarcheOpenAPI(AppProperties props) {
        return new OpenAPI()
                .info(new Info()
                        .title("Grossimarché API")
                        .version("v1")
                        .description("""
                                Wholesale (cash & carry) e-commerce REST API for the Moroccan market.
                                All endpoints are under /api/v1. Authenticate with a bearer JWT.""")
                        .contact(new Contact().name("Grossimarché"))
                        .license(new License().name("Proprietary")))
                .servers(List.of(new Server().url(props.api().publicUrl()).description("Current environment")))
                .components(new Components().addSecuritySchemes(BEARER_SCHEME,
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("RS256-signed access token issued by /api/v1/auth")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME));
    }
}
