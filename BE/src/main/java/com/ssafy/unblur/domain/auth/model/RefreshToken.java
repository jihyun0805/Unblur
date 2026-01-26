package com.ssafy.unblur.domain.auth.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Getter
@Table(
        name = "auth_refresh_token",
        indexes = {
                @Index(name = "idx_refresh_token_expires_at", columnList = "expires_at")
        }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true, columnDefinition = "uuid")
    private User user;

    @Column(nullable = false, length = 36, unique = true)
    private String jti;

    @Column(name="token_hash", nullable = false, length = 64)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "replaced_by_jti", length = 36)
    private String replacedByJti;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Builder
    private RefreshToken(User user, String jti, String tokenHash, Instant expiresAt) {
        this.user = user;
        this.jti = jti;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    public boolean isRevoked() {
        return revokedAt != null;
    }

    public boolean canRefresh() {
        return !isExpired() && !isRevoked() && replacedByJti == null;
    }

    public void revoke(String nextJti) {
        this.revokedAt = Instant.now();
        this.replacedByJti = nextJti;
    }

    public void update(String jti, String tokenHash, Instant expiresAt) {
        this.jti = jti;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
        this.revokedAt = null;
        this.replacedByJti = null;
    }
}
