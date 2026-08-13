package com.grossimarche.service;

import com.grossimarche.dto.attribute.AttributeRequest;
import com.grossimarche.dto.attribute.AttributeResponse;
import com.grossimarche.dto.attribute.AttributeValueRequest;
import com.grossimarche.dto.mapper.AttributeMapper;
import com.grossimarche.entity.Attribute;
import com.grossimarche.entity.AttributeValue;
import com.grossimarche.exception.ConflictException;
import com.grossimarche.exception.ResourceNotFoundException;
import com.grossimarche.repository.AttributeRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;

/**
 * The reusable attribute catalogue (Marque, Conditionnement, …). Reads are public (the
 * storefront builds filters from enabled attributes); mutations are open to STORE_MANAGER and
 * ADMIN as part of catalogue management.
 */
@Service
public class AttributeService {

    private final AttributeRepository attributeRepository;
    private final AttributeMapper attributeMapper;

    public AttributeService(AttributeRepository attributeRepository, AttributeMapper attributeMapper) {
        this.attributeRepository = attributeRepository;
        this.attributeMapper = attributeMapper;
    }

    @Transactional(readOnly = true)
    public List<AttributeResponse> list(boolean enabledOnly) {
        List<Attribute> attributes = enabledOnly
                ? attributeRepository.findByEnabledTrueOrderByNameAsc()
                : attributeRepository.findAllByOrderByNameAsc();
        return attributes.stream().map(attributeMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public AttributeResponse get(UUID id) {
        return attributeMapper.toResponse(getById(id));
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional
    public AttributeResponse create(AttributeRequest req) {
        String name = req.name().trim();
        if (attributeRepository.existsByNameIgnoreCase(name)) {
            throw new ConflictException("Un attribut portant ce nom existe déjà.");
        }
        Attribute attribute = Attribute.builder()
                .name(name)
                .type(req.type())
                .enabled(req.enabled())
                .build();
        attribute.replaceValues(buildValues(req.values()));
        return attributeMapper.toResponse(attributeRepository.save(attribute));
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional
    public AttributeResponse update(UUID id, AttributeRequest req) {
        Attribute attribute = getById(id);
        String name = req.name().trim();
        attributeRepository.findAllByOrderByNameAsc().stream()
                .filter(a -> !a.getId().equals(id) && a.getName().equalsIgnoreCase(name))
                .findAny()
                .ifPresent(a -> {
                    throw new ConflictException("Un attribut portant ce nom existe déjà.");
                });
        attribute.setName(name);
        attribute.setType(req.type());
        attribute.setEnabled(req.enabled());
        attribute.replaceValues(buildValues(req.values()));
        return attributeMapper.toResponse(attribute);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional
    public void delete(UUID id) {
        attributeRepository.delete(getById(id));
    }

    private List<AttributeValue> buildValues(List<AttributeValueRequest> values) {
        if (values == null) {
            return List.of();
        }
        return IntStream.range(0, values.size())
                .mapToObj(i -> {
                    AttributeValueRequest v = values.get(i);
                    return AttributeValue.builder()
                            .name(v.name().trim())
                            .enabled(v.enabled())
                            .displayOrder(i)
                            .build();
                })
                .toList();
    }

    private Attribute getById(UUID id) {
        return attributeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attribut", id));
    }
}
