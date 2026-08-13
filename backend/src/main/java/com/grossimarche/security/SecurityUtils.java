package com.grossimarche.security;

import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ErrorCode;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

/** Static access to the currently authenticated principal. */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    /** @throws BusinessException {@code TOKEN_INVALID} if no user is authenticated. */
    public static UUID currentUserId() {
        return currentUserIdOptional()
                .orElseThrow(() -> new BusinessException(ErrorCode.TOKEN_INVALID,
                        "Authentification requise."));
    }

    public static Optional<UUID> currentUserIdOptional() {
        return currentPrincipal().map(UserPrincipal::getUserId);
    }

    public static Optional<UserPrincipal> currentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof UserPrincipal p) {
            return Optional.of(p);
        }
        return Optional.empty();
    }
}
