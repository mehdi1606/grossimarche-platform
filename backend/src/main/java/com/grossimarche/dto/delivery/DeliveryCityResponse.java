package com.grossimarche.dto.delivery;

import com.grossimarche.entity.DeliveryCity;
import com.grossimarche.entity.DeliveryDistrict;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record DeliveryCityResponse(
        UUID id,
        String name,
        String slug,
        BigDecimal deliveryFee,
        int sortOrder,
        boolean active,
        List<District> districts
) {

    public static DeliveryCityResponse from(DeliveryCity city) {
        return new DeliveryCityResponse(city.getId(), city.getName(), city.getSlug(),
                city.getDeliveryFee(), city.getSortOrder(), city.isActive(),
                city.getDistricts().stream().map(District::from).toList());
    }

    public record District(UUID id, String name, int sortOrder, boolean active) {

        static District from(DeliveryDistrict d) {
            return new District(d.getId(), d.getName(), d.getSortOrder(), d.isActive());
        }
    }
}
