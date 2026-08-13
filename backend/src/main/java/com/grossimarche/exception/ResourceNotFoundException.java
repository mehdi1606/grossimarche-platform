package com.grossimarche.exception;

/** A requested resource does not exist (or must appear not to, to this caller). */
public class ResourceNotFoundException extends BusinessException {

    public ResourceNotFoundException(String message) {
        super(ErrorCode.RESOURCE_NOT_FOUND, message);
    }

    /** Convenience: "&lt;entity&gt; introuvable (id: &lt;id&gt;)". */
    public ResourceNotFoundException(String entity, Object id) {
        super(ErrorCode.RESOURCE_NOT_FOUND, entity + " introuvable (id: " + id + ")");
    }
}
