package com.grossimarche.controller.admin;

import com.grossimarche.dto.common.PageResponse;
import com.grossimarche.dto.staff.CreateStaffRequest;
import com.grossimarche.dto.staff.StaffResponse;
import com.grossimarche.dto.staff.UpdateStaffRequest;
import com.grossimarche.service.StaffAdminService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** Admin staff management (ADMIN only, enforced by @PreAuthorize on the service). */
@RestController
@RequestMapping("/api/v1/admin/staff")
public class AdminStaffController {

    private final StaffAdminService staffAdminService;

    public AdminStaffController(StaffAdminService staffAdminService) {
        this.staffAdminService = staffAdminService;
    }

    @GetMapping
    public PageResponse<StaffResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        return PageResponse.from(staffAdminService.list(pageable));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StaffResponse create(@Valid @RequestBody CreateStaffRequest body) {
        return staffAdminService.create(body);
    }

    @PatchMapping("/{id}")
    public StaffResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateStaffRequest body) {
        return staffAdminService.update(id, body);
    }

    /** Send the member a new temporary password (theirs is lost). */
    @PostMapping("/{id}/reset-password")
    public StaffResponse resetPassword(@PathVariable UUID id) {
        return staffAdminService.resetPassword(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        staffAdminService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
