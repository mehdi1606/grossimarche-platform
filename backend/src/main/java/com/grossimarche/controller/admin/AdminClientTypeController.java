package com.grossimarche.controller.admin;

import com.grossimarche.dto.clienttype.ClientTypeRequest;
import com.grossimarche.dto.clienttype.ClientTypeResponse;
import com.grossimarche.service.ClientTypeService;
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

/** Client-type management. ADMIN only; authorization is enforced on the service. */
@RestController
@RequestMapping("/api/v1/admin/client-types")
public class AdminClientTypeController {

    private final ClientTypeService clientTypeService;

    public AdminClientTypeController(ClientTypeService clientTypeService) {
        this.clientTypeService = clientTypeService;
    }

    /** Every segment, retired ones included - the back-office has to be able to revive them. */
    @GetMapping
    public List<ClientTypeResponse> list() {
        return clientTypeService.listAll();
    }

    @GetMapping("/{id}")
    public ClientTypeResponse get(@PathVariable UUID id) {
        return clientTypeService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClientTypeResponse create(@Valid @RequestBody ClientTypeRequest body) {
        return clientTypeService.create(body);
    }

    @PutMapping("/{id}")
    public ClientTypeResponse update(@PathVariable UUID id,
                                     @Valid @RequestBody ClientTypeRequest body) {
        return clientTypeService.update(id, body);
    }

    /**
     * Retire a segment.
     *
     * DELETE, but the row survives: customers belong to it and products will be priced against
     * it, so it is deactivated rather than removed. The verb matches what the back-office is
     * asking for; the service decides what "remove" can safely mean here.
     */
    @DeleteMapping("/{id}")
    public ClientTypeResponse deactivate(@PathVariable UUID id) {
        return clientTypeService.deactivate(id);
    }
}
