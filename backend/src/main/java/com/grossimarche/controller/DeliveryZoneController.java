package com.grossimarche.controller;

import com.grossimarche.dto.delivery.DeliveryCityResponse;
import com.grossimarche.service.DeliveryZoneService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Where we deliver, for the storefront's address form.
 *
 * Public: a shopper fills in a delivery address before they have finished registering, and the
 * list of cities we serve is a shop sign, not a price list.
 */
@RestController
@RequestMapping("/api/v1/delivery-cities")
public class DeliveryZoneController {

    private final DeliveryZoneService deliveryZoneService;

    public DeliveryZoneController(DeliveryZoneService deliveryZoneService) {
        this.deliveryZoneService = deliveryZoneService;
    }

    @GetMapping
    public List<DeliveryCityResponse> list() {
        return deliveryZoneService.listActive();
    }
}
