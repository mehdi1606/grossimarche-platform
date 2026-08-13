package com.grossimarche.repository;

import com.grossimarche.entity.User;
import com.grossimarche.entity.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByPhone(String phone);

    Optional<User> findByEmail(String email);

    boolean existsByPhone(String phone);

    boolean existsByEmail(String email);

    // ---- Admin customers / staff / dashboard ------------------------------------------

    long countByRole(Role role);

    long countByRoleAndCreatedAtGreaterThanEqual(Role role, Instant since);

    Page<User> findByRoleInOrderByCreatedAtDesc(Collection<Role> roles, Pageable pageable);

    /** Customers filtered by role, optionally matching a free-text query on name/phone/email. */
    @Query("select u from User u where u.role = :role and ("
            + ":q is null or lower(u.fullName) like lower(concat('%', :q, '%')) "
            + "or u.phone like concat('%', :q, '%') "
            + "or lower(u.email) like lower(concat('%', :q, '%')))")
    Page<User> searchByRole(Role role, String q, Pageable pageable);
}
