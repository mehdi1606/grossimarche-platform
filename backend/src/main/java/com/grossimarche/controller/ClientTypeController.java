package com.grossimarche.controller;

import com.grossimarche.dto.clienttype.ClientTypeResponse;
import com.grossimarche.service.ClientTypeService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * The segments a visitor picks from when signing up.
 *
 * Public, because the chooser is shown to someone who by definition has no account yet. It
 * returns names only - what each segment pays is resolved per authenticated customer and never
 * appears here.
 */
@RestController
@RequestMapping("/api/v1/client-types")
public class ClientTypeController {

    private final ClientTypeService clientTypeService;

    public ClientTypeController(ClientTypeService clientTypeService) {
        this.clientTypeService = clientTypeService;
    }

    @GetMapping
    public List<ClientTypeResponse> list() {
        return clientTypeService.listActive();
    }
}
