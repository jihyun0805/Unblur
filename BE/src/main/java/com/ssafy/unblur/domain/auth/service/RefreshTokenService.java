package com.ssafy.unblur.domain.auth.service;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.common.security.jwt.JWTUtil;
import com.ssafy.unblur.domain.auth.dto.TokenReissueResultDto;
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
     * 토큰의 유효성을 DB에서 검증합니다.
     */
    @Transactional(readOnly = true)
    public boolean validateToken(String jti, String token) {
        return refreshTokenRepository.findByJti(jti)
                .map(refreshToken ->
                        refreshToken.canRefresh() &&
                                refreshToken.getTokenHash().equals(hashToken(token)))
                .orElse(false);
    }

    /**
     * Refresh Token을 검증하고 새로운 토큰을 발급합니다. (Token Rotation)
     *
     */
    @Transactional
    public TokenReissueResultDto reissue(String refreshToken) {
        if (refreshToken == null) {
            throw new BaseException(ErrorCode.INVALID_TOKEN);
        }

        // JWT에서 정보 추출 및 검증
        String jti;
        String email;
        try {
            jti = jwtUtil.getJti(refreshToken);
            email = jwtUtil.getUsername(refreshToken);

            if (jwtUtil.isTokenExpired(refreshToken)) {
                throw new BaseException(ErrorCode.EXPIRED_TOKEN);
            }
        } catch (BaseException e) {
            throw e;
        } catch (Exception e) {
            throw new BaseException(ErrorCode.INVALID_TOKEN);
        }

        // DB에서 Refresh Token 검증
        if (!validateToken(jti, refreshToken)) {
            throw new BaseException(ErrorCode.INVALID_TOKEN);
        }

        // 사용자 조회
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        // 새로운 토큰 생성 (Token Rotation)
        String newAccessToken = jwtUtil.createAccessToken(user.getId(), email);
        String newRefreshToken = jwtUtil.createRefreshToken(user.getId(), email);

        // 새로운 Refresh Token 저장 (기존 토큰 대체)
        saveRefreshToken(user, newRefreshToken,
                jwtUtil.getJti(newRefreshToken),
                jwtUtil.getExpiration(newRefreshToken).toInstant());

        return new TokenReissueResultDto(newAccessToken, newRefreshToken);
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
