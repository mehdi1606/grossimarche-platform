package com.grossimarche.security;

import com.grossimarche.entity.User;
import com.grossimarche.entity.enums.Role;
import com.grossimarche.entity.enums.UserStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * The authenticated principal placed in the SecurityContext. Exposes the user id and role.
 * There is no password - authentication is by bearer JWT - so {@link #getPassword()} is
 * empty and never used.
 */
public class UserPrincipal implements UserDetails {

    private final UUID userId;
    private final String username;
    private final Role role;
    private final boolean active;

    public UserPrincipal(UUID userId, String username, Role role, boolean active) {
        this.userId = userId;
        this.username = username;
        this.role = role;
        this.active = active;
    }

    public static UserPrincipal from(User user) {
        return new UserPrincipal(user.getId(),
                user.getPhone() != null ? user.getPhone() : user.getEmail(),
                user.getRole(),
                user.getStatus() == UserStatus.ACTIVE);
    }

    public UUID getUserId() {
        return userId;
    }

    public Role getRole() {
        return role;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return "";
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return active;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
}
