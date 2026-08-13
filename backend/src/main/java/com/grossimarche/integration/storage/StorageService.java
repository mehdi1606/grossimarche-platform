package com.grossimarche.integration.storage;

/**
 * Stores binary assets (product images) behind a stable URL. A local-filesystem
 * implementation backs development; an S3-compatible implementation would back production.
 * The client-supplied filename is never trusted — a fresh key is always generated.
 */
public interface StorageService {

    /**
     * Store {@code content} and return its publicly reachable URL.
     *
     * @param content          the bytes
     * @param contentType      the validated MIME type (e.g. {@code image/png})
     * @param originalFilename the client filename — used only to derive an extension
     */
    String store(byte[] content, String contentType, String originalFilename);
}
