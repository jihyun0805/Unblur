package com.ssafy.unblur.domain.auth.model;

import com.ssafy.unblur.domain.auth.dto.SignupDto;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnTransformer;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * 사용자 기본 정보 및 인증 정보를 관리하는 엔티티.
 */
@Entity
@Table(
        name = "users",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_users_email", columnNames = "email"),
                @UniqueConstraint(name = "uk_users_nickname", columnNames = "nickname")
        }
)
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    /**
     * 사용자 고유 ID (PK).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * 이메일 주소 (UK).
     */
    @Column(nullable = false)
    private String email;

    /**
     * 암호화된 비밀번호.
     */
    @Column(name = "encrypted_password", nullable = false)
    private String password;

    /**
     * 인증 제공자 (LOCAL/GOOGLE/KAKAO/NAVER/APPLE).
     */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider", nullable = false, length = 20)
    private AuthProvider authProvider = AuthProvider.LOCAL;

    /**
     * 닉네임 (UK).
     */
    @Column(nullable = false, length = 10)
    private String nickname;

    /**
     * 생년월일.
     */
    @Column(name = "birth_date", nullable = false)
    private LocalDate birthDate;

    /**
     * 성별
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Gender gender;

    /**
     * 지역 정보.
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Region region;

    /**
     * MBTI 유형.
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 4)
    private Mbti mbti;

    /**
     * 한 줄 소개.
     */
    @Column(name = "intro", length = 200)
    private String intro;

    /**
     * 설문 응답/프로필 상세 JSON.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "detailed_info", columnDefinition = "jsonb")
    private Map<String, Object> detailedInfo;

    /**
     * 관심사 태그 목록.
     */
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "interest_tags", columnDefinition = "text[]")
    private String[] interestTags;

    /**
     * 관심사/가치관 임베딩 벡터 (384차원).
     */
    @Convert(converter = PgVectorConverter.class)
    @ColumnTransformer(
            write = "?::vector",
            read = "interests_vector::text"
    )
    @Column(name = "interests_vector", columnDefinition = "vector(384)")
    private float[] interestsVector;

    /**
     * 온라인 상태.
     */
    @Column(name = "is_online", nullable = false)
    private boolean online;

    /**
     * 마지막 활동 시각.
     */
    @Column(name = "last_active_at")
    private LocalDateTime lastActiveAt;

    /**
     * 선명도 점수 (0~100).
     */
    @Builder.Default
    @Column(name = "clarity_score", nullable = false)
    private Integer clarityScore = 50;

    /**
     * 계정 활성화 상태.
     */
    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    /**
     * 생성 시각.
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 수정 시각.
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * SignupDto와 암호화된 비밀번호를 받아 User 엔티티를 생성합니다.
     *
     * @param dto             회원가입 정보
     * @param encodedPassword 암호화된 비밀번호
     * @return 생성된 User 엔티티
     */
    public static User from(SignupDto dto, String encodedPassword) {
        return User.builder()
                .email(dto.getEmail())
                .password(encodedPassword)
                .nickname(dto.getNickname())
                .birthDate(dto.getBirthDate())
                .gender(dto.getGender())
                .authProvider(dto.getAuthProvider())
                .build();
    }
}
