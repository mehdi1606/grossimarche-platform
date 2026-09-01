package com.grossimarche.service;

import com.grossimarche.entity.User;
import com.grossimarche.entity.enums.Role;
import com.grossimarche.repository.UserRepository;
import com.grossimarche.security.SecurityUtils;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * Who is looking at the catalogue, and therefore which price list applies.
 *
 * The answer is a segment or nothing. Nothing is the common case - an anonymous visitor, an
 * applicant still waiting for validation, a staff member browsing the shop - and it means the
 * catalogue is rendered with no prices at all.
 *
 * That gate lives here, on the server, rather than in the storefront. Hiding prices in the page
 * would be theatre: the JSON would still carry them, and anyone could read the whole grid from
 * the browser's network tab. Since the grid is the confidential part of a wholesale business,
 * the API has to refuse to send it.
 */
@Component("catalogueViewer")
public class CatalogueViewer {

    private final UserRepository userRepository;

    public CatalogueViewer(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * The segment whose prices the caller may see, or empty if they may see none.
     *
     * Requires an ACTIVE customer with a segment: PENDING and REJECTED accounts exist but are
     * exactly the ones the validation gate is there to keep out of the price grid.
     */
    @Transactional(readOnly = true)
    public Optional<UUID> currentClientTypeId() {
        return SecurityUtils.currentUserIdOptional()
                .flatMap(userRepository::findById)
                .filter(user -> user.getRole() == Role.CLIENT)
                .filter(user -> user.getStatus().canTrade())
                .map(User::getClientType)
                .map(type -> type.getId());
    }

    /**
     * Cache-key fragment identifying the price list in force.
     *
     * The product-detail cache is keyed by slug, and per-segment pricing would otherwise let
     * the first caller's prices be served to every other segment - and to anonymous visitors.
     * Referenced from the {@code @Cacheable} SpEL expression, which is why this bean is named.
     */
    public String cacheKey() {
        return currentClientTypeId().map(UUID::toString).orElse("anon");
    }
}
