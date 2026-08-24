package com.grossimarche.service;

import com.grossimarche.entity.User;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ErrorCode;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Everything about back-office passwords in one place: generating one for a new staff member,
 * hashing it, and the strength rule applied when someone chooses their own.
 *
 * Passwords exist only for staff. Customers sign in with a one-time code and never have a
 * password, so nothing here is ever reached from the storefront.
 */
@Service
public class StaffPasswordService {

    // Ambiguous glyphs (O/0, l/1/I) are left out on purpose: a generated password is read off
    // an e-mail and retyped by hand, and "was that an l or a 1?" is a support ticket.
    private static final String LOWER = "abcdefghijkmnopqrstuvwxyz";
    private static final String UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final String DIGITS = "23456789";
    private static final String SYMBOLS = "!@#$%&*?";
    private static final int GENERATED_LENGTH = 14;

    /** Minimum for a password a human chooses. Generated ones are always well above this. */
    public static final int MIN_LENGTH = 10;

    private final SecureRandom random = new SecureRandom();
    private final PasswordEncoder passwordEncoder;

    public StaffPasswordService(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * A fresh password for an invited staff member: one guaranteed character from each class,
     * the rest random, then shuffled so the classes are not in a predictable order.
     */
    public String generate() {
        String all = LOWER + UPPER + DIGITS + SYMBOLS;
        List<Character> chars = new ArrayList<>(GENERATED_LENGTH);
        chars.add(pick(LOWER));
        chars.add(pick(UPPER));
        chars.add(pick(DIGITS));
        chars.add(pick(SYMBOLS));
        while (chars.size() < GENERATED_LENGTH) {
            chars.add(pick(all));
        }
        // Fisher-Yates with the same SecureRandom, so position carries no information.
        for (int i = chars.size() - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            Character tmp = chars.get(i);
            chars.set(i, chars.get(j));
            chars.set(j, tmp);
        }
        StringBuilder out = new StringBuilder(GENERATED_LENGTH);
        chars.forEach(out::append);
        return out.toString();
    }

    /** Hash {@code rawPassword} onto the account. Never stores the clear text. */
    public void assign(User user, String rawPassword, boolean mustChange) {
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setPasswordUpdatedAt(Instant.now());
        user.setMustChangePassword(mustChange);
    }

    public boolean matches(String rawPassword, String hash) {
        // A missing hash must never match: an account with no password cannot sign in with one.
        return hash != null && rawPassword != null && passwordEncoder.matches(rawPassword, hash);
    }

    /**
     * The rule for a self-chosen password. Deliberately about length and variety rather than a
     * long list of composition rules, which mostly produce "Password1!" and a sticky note.
     */
    public void validateStrength(String password) {
        if (password == null || password.length() < MIN_LENGTH) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Le mot de passe doit contenir au moins " + MIN_LENGTH + " caractères.");
        }
        boolean hasLetter = password.chars().anyMatch(Character::isLetter);
        boolean hasDigitOrSymbol = password.chars().anyMatch(c -> !Character.isLetter(c));
        if (!hasLetter || !hasDigitOrSymbol) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Le mot de passe doit mêler lettres et chiffres ou symboles.");
        }
    }

    private char pick(String alphabet) {
        return alphabet.charAt(random.nextInt(alphabet.length()));
    }
}
