package com.ssafy.unblur.domain.auth.service;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.common.security.jwt.JWTUtil;
import com.ssafy.unblur.domain.auth.dto.response.TokenReissueResponseDto;
import com.ssafy.unblur.domain.auth.model.RefreshToken;
import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.auth.repository.RefreshTokenRepository;
import com.ssafy.unblur.domain.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final JWTUtil jwtUtil;

    /**
     * 새로운 리프레시 토큰을 DB에 저장합니다.
     * 기존에 해당 사용자의 토큰이 있다면 업데이트하고, 없으면 새로 생성합니다.
     */
    @Transactional
    public void saveRefreshToken(User user, String token, String jti, Instant expiresAt) {
        // 기존 사용자의 토큰이 있는지 조회
        Optional<RefreshToken> existingToken = refreshTokenRepository.findByUser(user);

        // 토큰 해싱
        String tokenHash = hashToken(token);

        // 엔티티 빌드 및 저장
        if (existingToken.isPresent()) {
            existingToken.get().update(jti, tokenHash, expiresAt);
        } else {
            RefreshToken refreshToken = RefreshToken.builder()
                    .user(user)
                    .jti(jti)
                    .tokenHash(tokenHash)
                    .expiresAt(expiresAt)
                    .build();
            refreshTokenRepository.save(refreshToken);
        }
    }

    /**
     * Refresh Token을 검증하고 새로운 토큰을 발급합니다. (Token Rotation)
     * 동시 요청 시 race condition을 방지하기 위해 비관적 락을 사용합니다.
     */
    @Transactional
    public TokenReissueResponseDto reissue(String refreshToken) {
        if (refreshToken == null) {
            throw new BaseException(ErrorCode.INVALID_TOKEN);
        }

        // JWT에서 정보 추출
        String jti;
        String email;
        try {
            jti = jwtUtil.getJti(refreshToken);
            email = jwtUtil.getUsername(refreshToken);
        } catch (Exception e) {
            throw new BaseException(ErrorCode.INVALID_TOKEN);
        }

        // JWT 만료 검증
        if (jwtUtil.isTokenExpired(refreshToken)) {
            throw new BaseException(ErrorCode.EXPIRED_TOKEN);
        }

        // 사용자 조회
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        // DB에서 Refresh Token 조회 (비관적 락으로 동시 요청 직렬화)
        RefreshToken storedToken = refreshTokenRepository.findByUserForUpdate(user)
                .orElseThrow(() -> new BaseException(ErrorCode.INVALID_TOKEN));

        // jti 검증 (다른 요청이 이미 토큰을 교체했는지 확인)
        if (!storedToken.getJti().equals(jti)) {
            throw new BaseException(ErrorCode.INVALID_TOKEN);
        }

        // 토큰 해시 검증
        if (!storedToken.getTokenHash().equals(hashToken(refreshToken))) {
            throw new BaseException(ErrorCode.INVALID_TOKEN);
        }

        // 토큰 상태 검증 (만료, 취소, 교체 여부)
        if (!storedToken.canRefresh()) {
            throw new BaseException(ErrorCode.INVALID_TOKEN);
        }

        // 새로운 토큰 생성 (Token Rotation)
        String newAccessToken = jwtUtil.createAccessToken(user.getId(), email);
        String newRefreshToken = jwtUtil.createRefreshToken(user.getId(), email);
        String newJti = jwtUtil.getJti(newRefreshToken);

        // 기존 토큰 업데이트 (이미 락을 획득한 엔티티 직접 사용)
        storedToken.update(newJti, hashToken(newRefreshToken),
                jwtUtil.getExpiration(newRefreshToken).toInstant());

        return new TokenReissueResponseDto(newAccessToken, newRefreshToken);
    }

    /**
     * 로그아웃 시 토큰 삭제
     */
    @Transactional
    public void deleteTokenByUser(User user) {
        refreshTokenRepository.deleteByUser(user);
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
