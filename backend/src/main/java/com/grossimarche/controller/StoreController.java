package com.grossimarche.controller;

import com.grossimarche.dto.store.StoreResponse;
import com.grossimarche.service.StoreService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Public store locator. With lat/lng, results are distance-sorted. */
@RestController
@RequestMapping("/api/v1/stores")
public class StoreController {

    private final StoreService storeService;

    public StoreController(StoreService storeService) {
        this.storeService = storeService;
    }

    @GetMapping
    public List<StoreResponse> stores(@RequestParam(required = false) Double lat,
                                      @RequestParam(required = false) Double lng) {
        return storeService.getStores(lat, lng);
    }
}
