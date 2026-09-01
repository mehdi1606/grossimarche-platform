package com.grossimarche.repository;

import com.grossimarche.entity.User;
import com.grossimarche.entity.enums.Role;
import com.grossimarche.entity.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByPhone(String phone);

    Optional<User> findByEmail(String email);

    /** Sign-in lookup: an e-mail address is not case-sensitive, so neither is the login. */
    Optional<User> findByEmailIgnoreCase(String email);

    /** The validation queue: applications waiting, oldest first. */
    List<User> findByRoleAndStatusOrderByCreatedAtAsc(Role role, UserStatus status);

    /** Badge count for the back-office, without loading the queue itself. */
    long countByRoleAndStatus(Role role, UserStatus status);

    boolean existsByPhone(String phone);

    boolean existsByEmail(String email);

    // ---- Admin customers / staff / dashboard ------------------------------------------

    long countByRole(Role role);

    long countByRoleAndCreatedAtGreaterThanEqual(Role role, Instant since);

    Page<User> findByRoleInOrderByCreatedAtDesc(Collection<Role> roles, Pageable pageable);

    /**
     * Reachable e-mail addresses for a set of roles - the recipients of an offer announcement
     * or of a back-office alert. Blocked accounts and accounts without an e-mail are excluded
     * at the query, so no caller has to remember to filter them.
     */
    @Query("""
            select u.email from User u
            where u.role in :roles
              and u.status = com.grossimarche.entity.enums.UserStatus.ACTIVE
              and u.email is not null and u.email <> ''
            """)
    List<String> findActiveEmailsByRoles(Collection<Role> roles);

    /**
     * Customers filtered by role, optionally matching a free-text query on name/phone/email.
     * {@code q} is always a non-null string ("" = no filter); a null bind would be typed as
     * bytea by PostgreSQL and blow up {@code lower(...)}.
     */
    @Query("select u from User u where u.role = :role and ("
            + ":q = '' or lower(u.fullName) like lower(concat('%', :q, '%')) "
            + "or u.phone like concat('%', :q, '%') "
            + "or lower(u.email) like lower(concat('%', :q, '%')))")
    Page<User> searchByRole(Role role, String q, Pageable pageable);
}
