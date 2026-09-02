package com.grossimarche.service;

import com.grossimarche.dto.address.AddressRequest;
import com.grossimarche.dto.address.AddressResponse;
import com.grossimarche.entity.Address;
import com.grossimarche.exception.ResourceNotFoundException;
import com.grossimarche.repository.AddressRepository;
import com.grossimarche.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/** Delivery addresses with exactly one default per user (also enforced by a partial index). */
@Service
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public AddressService(AddressRepository addressRepository, UserRepository userRepository) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<AddressResponse> list(UUID userId) {
        return addressRepository.findByUserId(userId).stream().map(AddressService::toResponse).toList();
    }

    @Transactional
    public AddressResponse create(UUID userId, AddressRequest req) {
        boolean makeDefault = req.isDefault() || addressRepository.findByUserId(userId).isEmpty();
        if (makeDefault) {
            clearCurrentDefault(userId);
        }
        Address address = addressRepository.save(Address.builder()
                .user(userRepository.getReferenceById(userId))
                .label(req.label()).city(req.city()).district(req.district())
                .addressLine(req.addressLine())
                .lat(req.lat()).lng(req.lng()).isDefault(makeDefault)
                .build());
        return toResponse(address);
    }

    @Transactional
    public AddressResponse update(UUID userId, UUID id, AddressRequest req) {
        Address address = get(userId, id);
        if (req.isDefault() && !address.isDefault()) {
            clearCurrentDefault(userId);
        }
        address.setLabel(req.label());
        address.setCity(req.city());
        address.setDistrict(req.district());
        address.setAddressLine(req.addressLine());
        address.setLat(req.lat());
        address.setLng(req.lng());
        address.setDefault(req.isDefault() || address.isDefault());
        return toResponse(address);
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        addressRepository.delete(get(userId, id));
    }

    private Address get(UUID userId, UUID id) {
        return addressRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Adresse", id));
    }

    private void clearCurrentDefault(UUID userId) {
        addressRepository.findByUserIdAndIsDefaultTrue(userId).ifPresent(current -> {
            current.setDefault(false);
            addressRepository.saveAndFlush(current); // flush before another row claims default
        });
    }

    private static AddressResponse toResponse(Address a) {
        return new AddressResponse(a.getId(), a.getLabel(), a.getCity(), a.getDistrict(),
                a.getAddressLine(), a.getLat(), a.getLng(), a.isDefault());
    }
}
