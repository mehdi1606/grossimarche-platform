package com.grossimarche.controller.admin;

import com.grossimarche.dto.delivery.DeliveryCityRequest;
import com.grossimarche.dto.delivery.DeliveryCityResponse;
import com.grossimarche.service.DeliveryZoneService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/** Delivery rounds and their rates. ADMIN only; authorization is enforced on the service. */
@RestController
@RequestMapping("/api/v1/admin/delivery-cities")
public class AdminDeliveryZoneController {

    private final DeliveryZoneService deliveryZoneService;

    public AdminDeliveryZoneController(DeliveryZoneService deliveryZoneService) {
        this.deliveryZoneService = deliveryZoneService;
    }

    @GetMapping
    public List<DeliveryCityResponse> list() {
        return deliveryZoneService.listAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DeliveryCityResponse create(@Valid @RequestBody DeliveryCityRequest body) {
        return deliveryZoneService.create(body);
    }

    @PutMapping("/{id}")
    public DeliveryCityResponse update(@PathVariable UUID id,
                                       @Valid @RequestBody DeliveryCityRequest body) {
        return deliveryZoneService.update(id, body);
    }

    /** Stops delivery to the city; the row and its addresses survive. */
    @DeleteMapping("/{id}")
    public DeliveryCityResponse deactivate(@PathVariable UUID id) {
        return deliveryZoneService.deactivate(id);
    }
}
