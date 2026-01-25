package com.ssafy.unblur.domain.user.service;

import com.ssafy.unblur.domain.user.model.RefreshToken;
import com.ssafy.unblur.domain.user.model.User;
import com.ssafy.unblur.domain.user.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    /**
     * 새로운 리프레시 토큰을 DB에 저장합니다.
     * 기존에 해당 사용자의 토큰이 있다면 삭제하고 새로 생성합니다.
     */
    @Transactional
    public void saveRefreshToken(User user, String token, String jti, Instant expiresAt) {
        // 기존 사용자의 토큰이 있다면 삭제(1:1 관계 유지)
        refreshTokenRepository.deleteByUser(user);

        // 토큰 해싱
        String tokenHash = hashToken(token);

        // 엔티티 빌드 및 저장
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .jti(jti)
                .tokenHash(tokenHash)
                .expiresAt(expiresAt)
                .build();

        refreshTokenRepository.save(refreshToken);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 알고리즘을 찾을 수 없습니다.", e);
        }
    }
}
