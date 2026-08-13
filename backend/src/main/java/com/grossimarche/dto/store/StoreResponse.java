package com.grossimarche.dto.store;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;
import java.util.UUID;

/**
 * A store. {@code openingHours} is a structured map (day → "HH:mm-HH:mm" or "closed") so
 * clients compute a live Ouvert/Fermé indicator. {@code distanceKm} is present only when
 * the request supplied a location.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record StoreResponse(
        UUID id,
        String name,
        String city,
        String address,
        String phone,
        Map<String, String> openingHours,
        double lat,
        double lng,
        Double distanceKm,
        String directionsUrl
) {
}
