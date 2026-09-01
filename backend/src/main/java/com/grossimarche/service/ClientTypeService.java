package com.grossimarche.service;

import com.grossimarche.dto.clienttype.ClientTypeRequest;
import com.grossimarche.dto.clienttype.ClientTypeResponse;
import com.grossimarche.entity.ClientType;
import com.grossimarche.exception.ConflictException;
import com.grossimarche.exception.ResourceNotFoundException;
import com.grossimarche.repository.ClientTypeRepository;
import com.grossimarche.util.Slugs;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * The commercial segments customers are grouped into, and which select their price list.
 *
 * Management is ADMIN-only, alongside coupons and store settings rather than with the daily
 * catalogue work a store manager does. Creating a segment is not an operational act: it decides
 * how the whole price grid is cut, and every product then has to be priced against it.
 */
@Service
public class ClientTypeService {

    private final ClientTypeRepository repository;

    public ClientTypeService(ClientTypeRepository repository) {
        this.repository = repository;
    }

    /**
     * The segments a visitor can pick from when registering.
     *
     * Public on purpose: the chooser is shown before anyone has an account. It exposes the
     * names of the segments, which is a shop sign, not a price - the prices themselves stay
     * behind authentication.
     */
    @Transactional(readOnly = true)
    public List<ClientTypeResponse> listActive() {
        return repository.findAllByActiveTrueOrderBySortOrderAscNameAsc().stream()
                .map(ClientTypeResponse::from)
                .toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public List<ClientTypeResponse> listAll() {
        return repository.findAllByOrderBySortOrderAscNameAsc().stream()
                .map(ClientTypeResponse::from)
                .toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public ClientTypeResponse get(UUID id) {
        return ClientTypeResponse.from(require(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ClientTypeResponse create(ClientTypeRequest req) {
        String name = req.name().trim();
        requireNameFree(name, null);

        ClientType type = ClientType.builder()
                .name(name)
                .slug(uniqueSlug(name, null))
                .description(trimToNull(req.description()))
                .sortOrder(req.sortOrder() == null ? 0 : req.sortOrder())
                .active(req.active() == null || req.active())
                .build();
        return ClientTypeResponse.from(repository.save(type));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ClientTypeResponse update(UUID id, ClientTypeRequest req) {
        ClientType type = require(id);
        String name = req.name().trim();
        requireNameFree(name, id);

        // The slug follows a rename, but only far enough to stay unique - it is not reissued
        // on every save, so links and imports that already use it keep working.
        if (!type.getName().equalsIgnoreCase(name)) {
            type.setSlug(uniqueSlug(name, id));
        }
        type.setName(name);
        type.setDescription(trimToNull(req.description()));
        if (req.sortOrder() != null) {
            type.setSortOrder(req.sortOrder());
        }
        if (req.active() != null) {
            type.setActive(req.active());
        }
        return ClientTypeResponse.from(repository.save(type));
    }

    /**
     * Retire a segment.
     *
     * Deactivation, not deletion: customers belong to a type and - from the next phase on -
     * products carry a price per type. Removing the row would either orphan those or cascade
     * into deleting real pricing, so the segment simply stops being offered at registration.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ClientTypeResponse deactivate(UUID id) {
        ClientType type = require(id);
        type.setActive(false);
        return ClientTypeResponse.from(repository.save(type));
    }

    private ClientType require(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Type de client", id));
    }

    private void requireNameFree(String name, UUID selfId) {
        repository.findByNameIgnoreCase(name)
                .filter(existing -> selfId == null || !existing.getId().equals(selfId))
                .ifPresent(existing -> {
                    throw new ConflictException("Un type de client porte déjà ce nom.");
                });
    }

    private String uniqueSlug(String name, UUID selfId) {
        return Slugs.unique(name, "type", candidate -> repository.findBySlug(candidate)
                .filter(existing -> selfId == null || !existing.getId().equals(selfId))
                .isPresent());
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
