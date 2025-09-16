package com.team20.pki.authentication.service;

import com.team20.pki.authentication.dto.RefreshTokenVerificationResult;
import com.team20.pki.authentication.model.RefreshToken;
import com.team20.pki.authentication.repository.RefreshTokenRepository;
import com.team20.pki.common.model.User;
import com.team20.pki.common.repository.UserRepository;
import com.team20.pki.config.properties.AuthConfigProperties;
import com.team20.pki.encryption.service.CryptoHashService;
import com.team20.pki.util.SecureRandomGenerator;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.Cookie;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {
    public static final String COOKIE_NAME = "refresh-token";
    private static final int REFRESH_TOKEN_LENGTH = 256;
    private static final int SESSION_ID_LENGTH = 128;

    private final UserRepository userRepository;
    private final CryptoHashService cryptoHashService;
    private final RefreshTokenRepository refreshTokenRepository;

    private final AuthConfigProperties authConfig;
    private Duration refreshDuration;

    @PostConstruct
    public void init() {
        refreshDuration = Duration.ofMillis(authConfig.getRefreshTokenExpirationTimeMs());
    }

    /**
     * Creates a refresh token for a new session (after login)
     */
    public String generateNewRefreshToken(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("Invalid user id"));

        String token = SecureRandomGenerator.generateCode(REFRESH_TOKEN_LENGTH);

        RefreshToken refreshToken = RefreshToken.builder()
                .token(cryptoHashService.hash(token))
                .sessionId(SecureRandomGenerator.generateCode(SESSION_ID_LENGTH))
                .expirationTime(Instant.now().plus(refreshDuration))
                .revoked(false)
                .user(user)
                .build();

        refreshTokenRepository.save(refreshToken);

        return token;
    }

    public String rotateRefreshToken(RefreshToken oldToken) {
        String token = SecureRandomGenerator.generateCode(REFRESH_TOKEN_LENGTH);

        RefreshToken newToken = RefreshToken.builder()
                .token(cryptoHashService.hash(token))
                .sessionId(oldToken.getSessionId())
                .expirationTime(oldToken.getExpirationTime())
                .revoked(false)
                .user(oldToken.getUser())
                .build();

        oldToken.setRevoked(true);

        refreshTokenRepository.saveAll(List.of(oldToken, newToken));

        return token;
    }

    @Transactional
    public RefreshTokenVerificationResult verifyRefreshToken(String token) {
        if (token == null) {
            return RefreshTokenVerificationResult.createInvalid();
        }

        String hashedToken = cryptoHashService.hash(token);
        RefreshToken refreshToken = refreshTokenRepository.findByToken(hashedToken).orElse(null);
        if (refreshToken == null) {
            return RefreshTokenVerificationResult.createInvalid();
        }

        if (refreshToken.getRevoked() || refreshToken.getExpirationTime().isBefore(Instant.now())) {
            refreshTokenRepository.deleteAllBySessionId(refreshToken.getSessionId());
            return RefreshTokenVerificationResult.createInvalid();
        }

        return RefreshTokenVerificationResult.createValid(refreshToken);
    }

    @Transactional
    public void invalidateSession(String token) {
        if (token == null) return;
        String hashedToken = cryptoHashService.hash(token);
        Optional<RefreshToken> refreshToken = refreshTokenRepository.findByToken(hashedToken);
        refreshToken.ifPresent(rt -> refreshTokenRepository.deleteAllBySessionId(rt.getSessionId()));
    }

    public Cookie getNewRefreshTokenCookie(UUID userId) {
        String token = generateNewRefreshToken(userId);
        Cookie cookie = new Cookie(COOKIE_NAME, token);
        configureCookie(cookie);
        return cookie;
    }

    public Cookie getRotatedRefreshTokenCookie(RefreshToken oldToken) {
        String token = rotateRefreshToken(oldToken);
        Cookie cookie = new Cookie(COOKIE_NAME, token);
        configureCookie(cookie);
        return cookie;
    }

    private void configureCookie(Cookie cookie) {
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setMaxAge((int) (authConfig.getRefreshTokenExpirationTimeMs() / 1000));
        cookie.setPath("/api/auth/refresh");
    }

    public Cookie getCleanRefreshTokenCookie() {
        Cookie cookie = new Cookie(COOKIE_NAME, null);
        cookie.setMaxAge(0);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/api/auth/refresh");
        return cookie;
    }

    @EventListener(ContextRefreshedEvent.class)
    @Transactional
    public void initAfterStartup() {
        clearExpiredTokens();
    }

    @Scheduled(cron = "${config.refresh-token.delete-cron}")
    public void clearExpiredTokens() {
        refreshTokenRepository.deleteAllExpiredAndRevokedSessions();
    }
}
