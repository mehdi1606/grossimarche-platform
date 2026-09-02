package com.grossimarche.service;

import com.grossimarche.dto.customer.CustomerDetailResponse;
import com.grossimarche.dto.customer.CustomerSummaryResponse;
import com.grossimarche.dto.mapper.OrderMapper;
import com.grossimarche.entity.User;
import com.grossimarche.entity.enums.Role;
import com.grossimarche.entity.enums.UserStatus;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ErrorCode;
import com.grossimarche.exception.ResourceNotFoundException;
import com.grossimarche.repository.OrderRepository;
import com.grossimarche.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/** Admin management of customers (users with role CLIENT), backed by the existing user model. */
@Service
public class CustomerAdminService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final OrderMapper orderMapper;

    public CustomerAdminService(UserRepository userRepository, OrderRepository orderRepository,
                                OrderMapper orderMapper) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.orderMapper = orderMapper;
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional(readOnly = true)
    public Page<CustomerSummaryResponse> list(String q, Pageable pageable) {
        // Empty string = no filter. Never null: a null bind is typed as bytea by PostgreSQL
        // and breaks lower(...) in the search query.
        String query = (q == null) ? "" : q.trim();
        return userRepository.searchByRole(Role.CLIENT, query, pageable).map(this::toSummary);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional(readOnly = true)
    public CustomerDetailResponse get(UUID id) {
        User user = getCustomer(id);
        var recent = orderRepository.findByUserId(user.getId(),
                        PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(orderMapper::toSummary).getContent();
        return new CustomerDetailResponse(user.getId(), user.getFullName(), user.getPhone(),
                user.getEmail(), user.getStatus(), orderRepository.countByUserId(user.getId()),
                orderRepository.totalSpentByUser(user.getId()), user.getCreatedAt(), recent);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional
    public CustomerDetailResponse updateStatus(UUID id, UserStatus status) {
        if (status == UserStatus.DELETED) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "La suppression d'un compte relève du droit à l'effacement (loi 09-08), pas de cette action.");
        }
        User user = getCustomer(id);
        user.setStatus(status);
        return get(id);
    }

    private User getCustomer(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client", id));
        if (user.getRole() != Role.CLIENT) {
            throw new ResourceNotFoundException("Client", id);
        }
        return user;
    }

    private CustomerSummaryResponse toSummary(User user) {
        // Loaded with the page by the repository's entity graph, so reading it here costs
        // no extra query. Null for the accounts created before segments existed.
        String segment = user.getClientType() == null ? null : user.getClientType().getName();
        return new CustomerSummaryResponse(user.getId(), user.getFullName(), user.getPhone(),
                user.getEmail(), segment, user.getStatus(),
                orderRepository.countByUserId(user.getId()),
                orderRepository.totalSpentByUser(user.getId()), user.getCreatedAt());
    }
}
