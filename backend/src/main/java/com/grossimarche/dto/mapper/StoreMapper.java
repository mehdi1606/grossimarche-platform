package com.grossimarche.dto.mapper;

import com.grossimarche.dto.store.StoreResponse;
import com.grossimarche.entity.Store;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

/** Store entity → DTO, decoding the JSONB opening-hours and building a directions URL. */
@Component
public class StoreMapper {

    private static final TypeReference<Map<String, String>> HOURS = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;

    public StoreMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public StoreResponse toResponse(Store store, Double distanceKm) {
        return new StoreResponse(store.getId(), store.getName(), store.getCity(), store.getAddress(),
                store.getPhone(), parseHours(store.getOpeningHours()), store.getLat(), store.getLng(),
                distanceKm, directionsUrl(store));
    }

    private Map<String, String> parseHours(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        return objectMapper.readValue(json, HOURS);
    }

    private String directionsUrl(Store store) {
        return "https://www.google.com/maps/dir/?api=1&destination=" + store.getLat() + "," + store.getLng();
    }
}
