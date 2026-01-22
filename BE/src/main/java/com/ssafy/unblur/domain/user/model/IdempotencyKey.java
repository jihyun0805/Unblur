package com.ssafy.unblur.domain.user.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * 멱등성 키를 저장하는 엔티티.
 */
@Entity
@Table(
        name = "idempotency_keys",
        uniqueConstraints = @UniqueConstraint(name = "uk_idempotency_trace_id", columnNames = "trace_id")
)
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IdempotencyKey {

    /**
     * 멱등성 키 ID (PK).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * 요청 사용자.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * 클라이언트 traceId (UK).
     */
    @Column(name = "trace_id", nullable = false, length = 100)
    private String traceId;

    /**
     * 요청 경로.
     */
    @Column(name = "request_path", nullable = false)
    private String requestPath;

    /**
     * 응답 상태 코드.
     */
    @Column(name = "status_code", nullable = false)
    private Integer statusCode;

    /**
     * 응답 본문 (JSON).
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "response_body", columnDefinition = "jsonb")
    private Map<String, Object> responseBody;

    /**
     * 만료 시각.
     */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /**
     * 생성 시각.
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
