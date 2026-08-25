package com.grossimarche.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * The first back-office account, created at startup so a fresh deployment is never locked out
 * of its own admin. Idempotent: once the account exists with a password of its own, this is a
 * no-op.
 *
 * @param enabled  master switch; turn off once the account is established
 * @param email    sign-in identifier for the owner account
 * @param password initial password - <strong>override with BOOTSTRAP_ADMIN_PASSWORD</strong>
 *                 in any environment that is not a local machine
 * @param fullName display name for the account
 */
@ConfigurationProperties(prefix = "grossimarche.bootstrap-admin")
public record BootstrapAdminProperties(
        @DefaultValue("true") boolean enabled,
        @DefaultValue("") String email,
        @DefaultValue("") String password,
        @DefaultValue("Administrateur") String fullName
) {
}
