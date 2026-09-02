package com.grossimarche.service;

import com.grossimarche.dto.delivery.DeliveryCityRequest;
import com.grossimarche.dto.delivery.DeliveryCityResponse;
import com.grossimarche.entity.DeliveryCity;
import com.grossimarche.entity.DeliveryDistrict;
import com.grossimarche.exception.ConflictException;
import com.grossimarche.exception.ResourceNotFoundException;
import com.grossimarche.repository.DeliveryCityRepository;
import com.grossimarche.util.Slugs;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

/**
 * Where the shop delivers, and what each round costs.
 *
 * Also the authority the checkout asks for a rate. The table wins over the old
 * {@code grossimarche.pricing.city-fees} configuration, which stays only as a fallback for a
 * city nobody has created yet - two sources for one number is how they end up disagreeing, and
 * the one an admin can edit should be the one that counts.
 */
@Service
public class DeliveryZoneService {

    private final DeliveryCityRepository repository;

    public DeliveryZoneService(DeliveryCityRepository repository) {
        this.repository = repository;
    }

    /**
     * The rate for a city name as typed on an address, or empty if the shop has no round there.
     *
     * Matched on a normalised form: an address says "casablanca", " Casablanca " or
     * "CASABLANCA", and all three are the same van.
     */
    @Transactional(readOnly = true)
    public Optional<BigDecimal> rateFor(String cityName) {
        if (cityName == null || cityName.isBlank()) {
            return Optional.empty();
        }
        String wanted = normalise(cityName);
        return repository.findAllWithDistricts().stream()
                .filter(DeliveryCity::isActive)
                .filter(c -> normalise(c.getName()).equals(wanted) || c.getSlug().equals(wanted))
                .findFirst()
                .map(DeliveryCity::getDeliveryFee);
    }

    /** What the storefront offers in its address form: served cities and their districts. */
    @Transactional(readOnly = true)
    public List<DeliveryCityResponse> listActive() {
        return repository.findActiveWithDistricts().stream()
                .map(DeliveryCityResponse::from)
                .toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public List<DeliveryCityResponse> listAll() {
        return repository.findAllWithDistricts().stream()
                .map(DeliveryCityResponse::from)
                .toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public DeliveryCityResponse create(DeliveryCityRequest req) {
        String name = req.name().trim();
        requireNameFree(name, null);

        DeliveryCity city = DeliveryCity.builder()
                .name(name)
                .slug(uniqueSlug(name, null))
                .deliveryFee(req.deliveryFee())
                .sortOrder(req.sortOrder() == null ? 0 : req.sortOrder())
                .active(req.active() == null || req.active())
                .districts(new ArrayList<>())
                .build();
        applyDistricts(city, req.districts());
        return DeliveryCityResponse.from(repository.save(city));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public DeliveryCityResponse update(UUID id, DeliveryCityRequest req) {
        DeliveryCity city = require(id);
        String name = req.name().trim();
        requireNameFree(name, id);

        if (!city.getName().equalsIgnoreCase(name)) {
            city.setSlug(uniqueSlug(name, id));
        }
        city.setName(name);
        city.setDeliveryFee(req.deliveryFee());
        if (req.sortOrder() != null) {
            city.setSortOrder(req.sortOrder());
        }
        if (req.active() != null) {
            city.setActive(req.active());
        }
        applyDistricts(city, req.districts());
        return DeliveryCityResponse.from(repository.save(city));
    }

    /**
     * Stop delivering to a city.
     *
     * Deactivated, not deleted: customers have addresses there and orders reference them, and a
     * round that closes for the winter usually reopens.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public DeliveryCityResponse deactivate(UUID id) {
        DeliveryCity city = require(id);
        city.setActive(false);
        return DeliveryCityResponse.from(repository.save(city));
    }

    /**
     * Replace a city's districts with what the form submitted.
     *
     * Rebuilt in place through the existing collection so orphanRemoval deletes what was taken
     * out; assigning a brand-new list would detach the old one and Hibernate refuses that on an
     * orphan-removal collection.
     */
    private void applyDistricts(DeliveryCity city, List<DeliveryCityRequest.District> submitted) {
        city.getDistricts().clear();
        if (submitted == null) {
            return;
        }
        int order = 1;
        List<String> seen = new ArrayList<>();
        for (DeliveryCityRequest.District d : submitted) {
            String name = d.name().trim();
            String key = normalise(name);
            if (name.isEmpty() || seen.contains(key)) {
                // A duplicate district is a typo, not an instruction: two "Anfa" in one list
                // would break the unique constraint and lose the whole save.
                continue;
            }
            seen.add(key);
            city.getDistricts().add(DeliveryDistrict.builder()
                    .city(city)
                    .name(name)
                    .sortOrder(order++)
                    .active(d.active() == null || d.active())
                    .build());
        }
    }

    private DeliveryCity require(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ville", id));
    }

    private void requireNameFree(String name, UUID selfId) {
        repository.findByNameIgnoreCase(name)
                .filter(existing -> selfId == null || !existing.getId().equals(selfId))
                .ifPresent(existing -> {
                    throw new ConflictException("Cette ville est déjà dans la liste.");
                });
    }

    private String uniqueSlug(String name, UUID selfId) {
        return Slugs.unique(name, "ville", candidate -> repository.findBySlug(candidate)
                .filter(existing -> selfId == null || !existing.getId().equals(selfId))
                .isPresent());
    }

    /** Lowercase, unaccented, trimmed - the form two people type the same city in. */
    private String normalise(String value) {
        return Normalizer.normalize(value.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
    }
}
