package com.grossimarche.service;

import com.grossimarche.dto.mapper.StoreMapper;
import com.grossimarche.dto.store.StoreRequest;
import com.grossimarche.dto.store.StoreResponse;
import com.grossimarche.entity.Store;
import com.grossimarche.exception.ResourceNotFoundException;
import com.grossimarche.repository.StoreRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.UUID;

/**
 * Store locator (distance sorting done in SQL) and admin CRUD. Distance for display is
 * computed with the same haversine formula used to sort.
 */
@Service
public class StoreService {

    private final StoreRepository storeRepository;
    private final StoreMapper storeMapper;
    private final ObjectMapper objectMapper;

    public StoreService(StoreRepository storeRepository, StoreMapper storeMapper,
                        ObjectMapper objectMapper) {
        this.storeRepository = storeRepository;
        this.storeMapper = storeMapper;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<StoreResponse> getStores(Double lat, Double lng) {
        if (lat == null || lng == null) {
            return storeRepository.findByActiveTrue().stream()
                    .map(s -> storeMapper.toResponse(s, null))
                    .toList();
        }
        return storeRepository.findActiveOrderByDistance(lat, lng).stream()
                .map(s -> storeMapper.toResponse(s, round(haversineKm(lat, lng, s.getLat(), s.getLng()))))
                .toList();
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional
    public StoreResponse create(StoreRequest req) {
        Store store = Store.builder()
                .name(req.name()).city(req.city()).address(req.address()).phone(req.phone())
                .openingHours(serializeHours(req)).lat(req.lat()).lng(req.lng()).active(req.active())
                .build();
        return storeMapper.toResponse(storeRepository.save(store), null);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional
    public StoreResponse update(UUID id, StoreRequest req) {
        Store store = getById(id);
        store.setName(req.name());
        store.setCity(req.city());
        store.setAddress(req.address());
        store.setPhone(req.phone());
        store.setOpeningHours(serializeHours(req));
        store.setLat(req.lat());
        store.setLng(req.lng());
        store.setActive(req.active());
        return storeMapper.toResponse(store, null);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional
    public void delete(UUID id) {
        getById(id).setActive(false);
    }

    private Store getById(UUID id) {
        return storeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Magasin", id));
    }

    private String serializeHours(StoreRequest req) {
        return req.openingHours() == null ? null : objectMapper.writeValueAsString(req.openingHours());
    }

    private static double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private static double round(double km) {
        return Math.round(km * 10.0) / 10.0;
    }
}
