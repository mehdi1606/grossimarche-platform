package com.grossimarche.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Object-storage settings. For local development files are written under {@code directory}
 * and served under {@code publicBaseUrl}. Real S3-compatible settings would live here too.
 */
@ConfigurationProperties(prefix = "grossimarche.storage")
public record StorageProperties(
        @DefaultValue("./data/uploads") String directory,
        @DefaultValue("http://localhost:8080/files") String publicBaseUrl,
        @DefaultValue("5242880") long maxFileSizeBytes
) {
}
