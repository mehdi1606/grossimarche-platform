package com.grossimarche.service;

import com.grossimarche.dto.auth.OtpRequestResponse;
import com.grossimarche.dto.user.UpdateProfileRequest;
import com.grossimarche.dto.user.UserResponse;
import com.grossimarche.entity.LoyaltyAccount;
import com.grossimarche.entity.User;
import com.grossimarche.entity.enums.OtpChannel;
import com.grossimarche.entity.enums.UserStatus;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ConflictException;
import com.grossimarche.exception.ErrorCode;
import com.grossimarche.exception.ResourceNotFoundException;
import com.grossimarche.repository.AddressRepository;
import com.grossimarche.repository.CartItemRepository;
import com.grossimarche.repository.CartRepository;
import com.grossimarche.repository.LoyaltyAccountRepository;
import com.grossimarche.repository.OrderRepository;
import com.grossimarche.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Profile, contact-change (fresh OTP required for a new phone/email) and loi 09-08 data
 * rights: erasure (anonymise, keep orders for accounting) and access (JSON export).
 */
@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final OrderRepository orderRepository;
    private final LoyaltyAccountRepository loyaltyAccountRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final OtpService otpService;
    private final AuditService auditService;
    private final StaffPasswordService staffPasswordService;

    public ProfileService(UserRepository userRepository, AddressRepository addressRepository,
                          OrderRepository orderRepository, LoyaltyAccountRepository loyaltyAccountRepository,
                          CartRepository cartRepository, CartItemRepository cartItemRepository,
                          OtpService otpService, AuditService auditService,
                          StaffPasswordService staffPasswordService) {
        this.userRepository = userRepository;
        this.addressRepository = addressRepository;
        this.orderRepository = orderRepository;
        this.loyaltyAccountRepository = loyaltyAccountRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.otpService = otpService;
        this.auditService = auditService;
        this.staffPasswordService = staffPasswordService;
    }

    @Transactional(readOnly = true)
    public UserResponse getMe(UUID userId) {
        return toResponse(user(userId));
    }

    @Transactional
    public UserResponse updateProfile(UUID userId, UpdateProfileRequest req) {
        User user = user(userId);
        if (req.fullName() != null) {
            user.setFullName(req.fullName());
        }
        return toResponse(user);
    }

    /**
     * Change one's own back-office password.
     *
     * Only meaningful for a staff account: a customer has no password to change, and is told
     * so plainly rather than being handed a confusing validation error. The current password
     * is verified first, so an unattended open session cannot be used to take the account.
     */
    @Transactional
    public void changePassword(UUID userId, String currentPassword, String newPassword) {
        User user = user(userId);
        if (user.getPasswordHash() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Ce compte n'utilise pas de mot de passe.");
        }
        if (!staffPasswordService.matches(currentPassword, user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Mot de passe actuel incorrect.");
        }
        if (staffPasswordService.matches(newPassword, user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Le nouveau mot de passe doit être différent de l'ancien.");
        }
        staffPasswordService.validateStrength(newPassword);
        staffPasswordService.assign(user, newPassword, false);
        auditService.record(userId, "PASSWORD_CHANGED", "User", userId.toString(), null, null, null);
    }

    /** Step 1 of a phone/email change: send an OTP to the NEW destination. */
    public OtpRequestResponse requestContactChange(UUID userId, OtpChannel channel, String newDestination,
                                                   String ip) {
        user(userId); // ensure the caller exists
        return otpService.request(channel, newDestination, ip);
    }

    /** Step 2: verify the new destination, then apply the change. */
    @Transactional
    public UserResponse confirmContactChange(UUID userId, OtpChannel channel, String newDestination,
                                             String code) {
        User user = user(userId);
        OtpService.VerifiedOtp verified = otpService.verify(channel, newDestination, code);
        String dest = verified.destination();
        if (channel == OtpChannel.SMS) {
            userRepository.findByPhone(dest).filter(u -> !u.getId().equals(userId)).ifPresent(u -> {
                throw new ConflictException("Ce numéro est déjà utilisé.");
            });
            user.setPhone(dest);
            user.setPhoneVerified(true);
        } else {
            userRepository.findByEmail(dest).filter(u -> !u.getId().equals(userId)).ifPresent(u -> {
                throw new ConflictException("Cet e-mail est déjà utilisé.");
            });
            user.setEmail(dest);
            user.setEmailVerified(true);
        }
        auditService.record(userId, "CONTACT_CHANGED", "User", userId.toString(), null, null,
                "{\"channel\":\"" + channel + "\"}");
        return toResponse(user);
    }

    /** Right to erasure: anonymise the user, drop addresses/cart; orders stay for accounting. */
    @Transactional
    public void deleteMe(UUID userId) {
        User user = user(userId);
        cartRepository.findByUserId(userId).ifPresent(cart -> {
            cartItemRepository.deleteByCartId(cart.getId());
            cartRepository.delete(cart);
        });
        addressRepository.findByUserId(userId).forEach(addressRepository::delete);

        user.setFullName(null);
        user.setPhone(null);
        // Keep a unique, non-null value to satisfy the phone-or-email CHECK constraint.
        user.setEmail("deleted-" + userId + "@anonymized.invalid");
        user.setPhoneVerified(false);
        user.setEmailVerified(false);
        user.setStatus(UserStatus.DELETED);
        auditService.record(userId, "ACCOUNT_DELETED", "User", userId.toString(), null, null, null);
    }

    /** Right of access: a complete JSON export of the person's data. */
    @Transactional(readOnly = true)
    public Map<String, Object> exportMe(UUID userId) {
        User user = user(userId);
        Map<String, Object> export = new LinkedHashMap<>();
        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("id", user.getId());
        profile.put("fullName", user.getFullName());
        profile.put("phone", user.getPhone());
        profile.put("email", user.getEmail());
        profile.put("role", user.getRole());
        profile.put("consentAt", user.getConsentAt());
        export.put("profile", profile);

        export.put("addresses", addressRepository.findByUserId(userId).stream()
                .map(a -> Map.of("label", nullSafe(a.getLabel()), "city", a.getCity(),
                        "addressLine", a.getAddressLine(), "isDefault", a.isDefault()))
                .toList());

        export.put("orders", orderRepository.findByUserId(userId, PageRequest.of(0, 1000)).stream()
                .map(o -> Map.of("orderNumber", o.getOrderNumber(), "status", o.getStatus(),
                        "total", o.getTotal(), "createdAt", o.getCreatedAt()))
                .toList());

        loyaltyAccountRepository.findById(userId).ifPresent(l -> export.put("loyalty",
                Map.of("balance", l.getPointsBalance(), "tier", l.getTier(),
                        "lifetimePoints", l.getLifetimePoints())));
        return export;
    }

    private User user(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", userId));
    }

    private static String nullSafe(String s) {
        return s == null ? "" : s;
    }

    private static UserResponse toResponse(User user) {
        return UserResponse.from(user);
    }
}
