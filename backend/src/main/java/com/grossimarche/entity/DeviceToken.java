package com.grossimarche.entity;

import com.grossimarche.entity.enums.DevicePlatform;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One device a customer can be reached on.
 *
 * The token is Firebase's, not ours: the app receives it from Google and hands it over at
 * sign-in. It can change without warning - a reinstall, a restored backup - so it is the
 * app's job to re-register, and the server's job to drop a token Firebase later refuses.
 */
@Entity
@Table(name = "device_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceToken extends AuditableEntity {

    /**
     * Whose device it is now. A shop phone can change hands between two accounts, so this is
     * reassigned on registration rather than refused as a duplicate.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "token", nullable = false, columnDefinition = "text")
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(name = "platform", nullable = false, length = 16)
    private DevicePlatform platform;
}
