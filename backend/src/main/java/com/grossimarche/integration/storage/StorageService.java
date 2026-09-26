package com.grossimarche.integration.storage;

/**
 * Stores binary assets (product images) behind a stable URL. A local-filesystem
 * implementation backs development; an S3-compatible implementation would back production.
 * The client-supplied filename is never trusted - a fresh key is always generated.
 */
public interface StorageService {

    /**
     * Store {@code content} and return its publicly reachable URL.
     *
     * @param content          the bytes
     * @param contentType      the validated MIME type (e.g. {@code image/png})
     * @param originalFilename the client filename - used only to derive an extension
     */
    String store(byte[] content, String contentType, String originalFilename);

    /**
     * Read back a file this service stored, by the URL it returned.
     *
     * Exists for e-mail. A mail client fetches pictures over the public internet, and a shop
     * reachable only at localhost has no such address - so an offer's photo has to travel
     * inside the message instead of being linked. Empty when the URL is not one of ours, the
     * file is gone, or it cannot be read: an announcement must still go out without its
     * picture.
     */
    java.util.Optional<StoredFile> read(String publicUrl);

    /** A stored file's bytes, with the type to declare when serving or attaching them. */
    record StoredFile(byte[] content, String contentType) {
    }
}
