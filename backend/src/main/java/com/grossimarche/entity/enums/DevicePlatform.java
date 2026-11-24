package com.grossimarche.entity.enums;

/**
 * Which app registered a device token.
 *
 * Kept even though Firebase addresses all three the same way: when a token is refused as stale,
 * the platform is what says whether the problem is one phone or every iPhone at once.
 */
public enum DevicePlatform {
    ANDROID,
    IOS,
    WEB
}
