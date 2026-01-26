package com.ssafy.unblur.common.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Slf4j
@Component
public class JWTUtil {

    private final SecretKey secretKey;
    private static final long ACCESS_TOKEN_EXPIRED_MS = 2 * 60 * 60 * 1000L;
    private static final long REFRESH_TOKEN_EXPIRED_MS = 14 * 24 * 60 * 60 * 1000L;

    public JWTUtil(@Value("${jwt.secret}") String secret) {

        secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), Jwts.SIG.HS256.key().build().getAlgorithm());
    }

    private Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String getUsername(String token) {
        return parseToken(token).get("username", String.class);
    }

    public String getJti(String token) {
        return parseToken(token).getId();
    }

    public Date getExpiration(String token) {
        return parseToken(token).getExpiration();
    }

    public Boolean isTokenExpired(String token) {
        return parseToken(token).getExpiration().before(new Date());
    }

    public String createJwt(String jti, String username, Long expiredMs) {
        return Jwts.builder()
                .id(jti)
                .claim("username", username)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiredMs))
                .signWith(secretKey)
                .compact();
    }

    public String createAccessToken(String username) {
        String jti = UUID.randomUUID().toString();
        return createJwt(jti, username, ACCESS_TOKEN_EXPIRED_MS);
    }

    public String createRefreshToken(String username) {
        String jti = UUID.randomUUID().toString();
        return createJwt(jti, username, REFRESH_TOKEN_EXPIRED_MS);
    }
}
