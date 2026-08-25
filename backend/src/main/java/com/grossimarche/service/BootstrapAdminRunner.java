package com.grossimarche.service;

import com.grossimarche.config.BootstrapAdminProperties;
import com.grossimarche.entity.User;
import com.grossimarche.entity.enums.Role;
import com.grossimarche.entity.enums.UserStatus;
import com.grossimarche.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Locale;

/**
 * Creates the owner's back-office account on startup, so a fresh database is never left with
 * no way in - there is no public sign-up for staff, and staff accounts can only be created by
 * an existing ADMIN.
 *
 * Deliberately conservative, because it runs on every boot:
 * <ul>
 *   <li>the account is created if it does not exist;</li>
 *   <li>if it exists but has no password (e.g. it was created before password sign-in, or by
 *       the OTP flow), the configured password is set;</li>
 *   <li>if it already has a password, <em>nothing</em> is touched - a boot must never reset a
 *       password the owner has since changed.</li>
 * </ul>
 */
@Component
public class BootstrapAdminRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(BootstrapAdminRunner.class);

    private final BootstrapAdminProperties props;
    private final UserRepository userRepository;
    private final StaffPasswordService passwordService;

    public BootstrapAdminRunner(BootstrapAdminProperties props, UserRepository userRepository,
                                StaffPasswordService passwordService) {
        this.props = props;
        this.userRepository = userRepository;
        this.passwordService = passwordService;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!props.enabled() || !StringUtils.hasText(props.email())
                || !StringUtils.hasText(props.password())) {
            return;
        }
        String email = props.email().trim().toLowerCase(Locale.ROOT);

        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null) {
            user = User.builder()
                    .fullName(props.fullName())
                    .email(email)
                    .role(Role.ADMIN)
                    .status(UserStatus.ACTIVE)
                    .emailVerified(true)
                    .phoneVerified(false)
                    .build();
            // The owner chose this password, so they are not forced to change it on first use.
            passwordService.assign(user, props.password(), false);
            userRepository.save(user);
            log.info("Bootstrap admin account created for {}.", mask(email));
            return;
        }

        if (user.getPasswordHash() == null) {
            // Pre-existing account (created through the OTP flow) being given a password.
            user.setRole(Role.ADMIN);
            user.setStatus(UserStatus.ACTIVE);
            passwordService.assign(user, props.password(), false);
            log.info("Bootstrap admin password set for the existing account {}.", mask(email));
            return;
        }

        log.debug("Bootstrap admin {} already has a password; leaving it untouched.", mask(email));
    }

    private String mask(String email) {
        int at = email.indexOf('@');
        return at <= 1 ? "***" : email.charAt(0) + "***" + email.substring(at);
    }
}
