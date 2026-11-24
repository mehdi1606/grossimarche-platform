package com.grossimarche.service;

import com.grossimarche.dto.device.DeviceRegistrationRequest;
import com.grossimarche.entity.DeviceToken;
import com.grossimarche.entity.User;
import com.grossimarche.exception.ResourceNotFoundException;
import com.grossimarche.repository.DeviceTokenRepository;
import com.grossimarche.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.UUID;

/**
 * The devices a customer can be reached on.
 *
 * Registration is idempotent on purpose: the app sends its token at every start, because a
 * token rotates without warning after a reinstall or a restore. A token already known is moved
 * to whoever signed in last - a shop phone changes hands, and the previous owner must stop
 * receiving the new owner's orders.
 */
@Service
public class DeviceService {

    private static final Logger log = LoggerFactory.getLogger(DeviceService.class);

    private final DeviceTokenRepository deviceRepository;
    private final UserRepository userRepository;

    public DeviceService(DeviceTokenRepository deviceRepository, UserRepository userRepository) {
        this.deviceRepository = deviceRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void register(UUID userId, DeviceRegistrationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", userId));

        deviceRepository.findByToken(request.token())
                .ifPresentOrElse(
                        existing -> {
                            existing.setUser(user);
                            existing.setPlatform(request.platform());
                        },
                        () -> deviceRepository.save(DeviceToken.builder()
                                .user(user)
                                .token(request.token())
                                .platform(request.platform())
                                .build()));
    }

    /**
     * Forget a device - at sign-out, so a shared phone stops showing the previous account's
     * notifications.
     */
    @Transactional
    public void forget(String token) {
        deviceRepository.deleteByToken(token);
    }

    /**
     * Drop tokens the push service has refused as unregistered.
     *
     * Its own transaction, and never allowed to fail the send that discovered them: a stale
     * token left in place only costs one wasted call next time.
     */
    @Transactional
    public void dropStale(Collection<String> tokens) {
        if (tokens == null || tokens.isEmpty()) {
            return;
        }
        try {
            deviceRepository.deleteByTokenIn(tokens);
            log.info("Dropped {} device token(s) the push service no longer recognises.",
                    tokens.size());
        } catch (Exception e) {
            log.warn("Stale device tokens could not be dropped", e);
        }
    }
}
