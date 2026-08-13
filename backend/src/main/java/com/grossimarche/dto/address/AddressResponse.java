package com.grossimarche.dto.address;

import java.util.UUID;

/** A stored delivery address. */
public record AddressResponse(
        UUID id,
        String label,
        String city,
        String addressLine,
        Double lat,
        Double lng,
        boolean isDefault
) {
}
