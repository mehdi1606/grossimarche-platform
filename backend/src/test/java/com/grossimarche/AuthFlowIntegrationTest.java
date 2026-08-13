package com.grossimarche;

import com.grossimarche.dto.auth.OtpRequestResponse;
import com.grossimarche.dto.auth.TokenResponse;
import com.grossimarche.entity.User;
import com.grossimarche.entity.enums.OtpChannel;
import com.grossimarche.exception.InvalidOtpException;
import com.grossimarche.exception.RateLimitExceededException;
import com.grossimarche.integration.OtpSender;
import com.grossimarche.repository.LoyaltyAccountRepository;
import com.grossimarche.repository.UserRepository;
import com.grossimarche.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * B4 integration test over real Postgres + Redis. A test OTP sender captures the generated
 * code (which is never exposed by the API) so the verify flow can be exercised end to end.
 * The exhaustive OTP suite (both channels, expiry, reuse, replay, denylist) is built in B11.
 */
@SpringBootTest
@ActiveProfiles("test")
@Import({TestcontainersConfiguration.class, AuthFlowIntegrationTest.CapturingOtpConfig.class})
@TestPropertySource(properties = "grossimarche.otp.provider=test")
class AuthFlowIntegrationTest {

    static final Map<OtpChannel, String> CAPTURED = new ConcurrentHashMap<>();

    @Autowired
    AuthService authService;
    @Autowired
    UserRepository userRepository;
    @Autowired
    LoyaltyAccountRepository loyaltyAccountRepository;

    @Test
    void firstLogin_createsUserAndLoyaltyAccount_andIssuesTokens() {
        OtpRequestResponse request = authService.requestOtp(OtpChannel.SMS, "0612345678", "1.2.3.4");
        assertThat(request.maskedDestination()).isEqualTo("+2126••••••78");
        assertThat(request.expiresInSeconds()).isEqualTo(300);

        String code = CAPTURED.get(OtpChannel.SMS);
        TokenResponse tokens = authService.verifyAndAuthenticate(
                OtpChannel.SMS, "0612345678", code, "1.2.3.4", "junit");

        assertThat(tokens.accessToken()).isNotBlank();
        assertThat(tokens.refreshToken()).isNotBlank();
        assertThat(tokens.user().phone()).isEqualTo("+212612345678");

        User user = userRepository.findByPhone("+212612345678").orElseThrow();
        assertThat(loyaltyAccountRepository.findById(user.getId())).isPresent();
    }

    @Test
    void wrongCode_isRejected() {
        authService.requestOtp(OtpChannel.EMAIL, "shop@bennani.ma", "5.6.7.8");
        String real = CAPTURED.get(OtpChannel.EMAIL);
        String wrong = "000000".equals(real) ? "111111" : "000000";

        assertThatThrownBy(() -> authService.verifyAndAuthenticate(
                OtpChannel.EMAIL, "shop@bennani.ma", wrong, "5.6.7.8", "junit"))
                .isInstanceOf(InvalidOtpException.class);
    }

    @Test
    void fourthRequestToSameDestination_isRateLimited() {
        for (int i = 0; i < 3; i++) {
            authService.requestOtp(OtpChannel.SMS, "0700000000", "9.9.9.9");
        }
        assertThatThrownBy(() -> authService.requestOtp(OtpChannel.SMS, "0700000000", "9.9.9.9"))
                .isInstanceOf(RateLimitExceededException.class);
    }

    /** Replaces the real senders (provider=test disables both logging and live). */
    @TestConfiguration
    static class CapturingOtpConfig {

        @Bean
        OtpSender smsCapture() {
            return capturing(OtpChannel.SMS);
        }

        @Bean
        OtpSender emailCapture() {
            return capturing(OtpChannel.EMAIL);
        }

        private OtpSender capturing(OtpChannel channel) {
            return new OtpSender() {
                @Override
                public void send(String destination, String code) {
                    CAPTURED.put(channel, code);
                }

                @Override
                public OtpChannel channel() {
                    return channel;
                }
            };
        }
    }
}
