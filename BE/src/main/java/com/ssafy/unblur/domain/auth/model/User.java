package com.ssafy.unblur.domain.auth.model;

import com.ssafy.unblur.domain.auth.dto.SignupDto;
import com.ssafy.unblur.domain.user.dto.UserProfileUpdateRequestDto;
import com.ssafy.unblur.domain.user.dto.UserSurveyUpdateRequestDto;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnTransformer;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.List;
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
     * 프로필 이미지 URL.
     */
    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

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
    private List<Map<String, Object>> detailedInfo;

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
     * 탈퇴 시각
     */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /**
     * SignupDto와 암호화된 비밀번호를 받아 User 엔티티를 생성합니다.
     */
    public static User from(SignupDto dto, String encodedPassword) {
        return User.builder()
                .email(dto.getEmail())
                .password(encodedPassword)
                .nickname(dto.getNickname())
                .birthDate(dto.getBirthDate())
                .gender(dto.getGender())
                .region(dto.getRegion())
                .detailedInfo(dto.getDetailedInfo())
                .interestTags(dto.getInterestTags() != null ?
                        dto.getInterestTags().toArray(String[]::new) : new String[0])
                .mbti(dto.getMbti())
                .intro(dto.getIntro())
                .build();
    }

    /**
     * 회원 탈퇴를 진행하여 유저의 정보를 변경합니다.
     */
    public void withdraw() {
        this.active = false; // 어떤 필드를 사용할 지에 대해서는 논의 후 결정
        this.deletedAt = LocalDateTime.now();
        this.email = this.email + "_del_" + this.id.toString().substring(0, 8);
        this.nickname = "탈퇴" + this.id.toString().substring(0, 7);
        this.password = "DELETED";
        this.profileImageUrl = null;
        this.intro = null;
        this.detailedInfo = null;
        this.interestTags = null;
        this.interestsVector = null;
        this.region = null;
        this.mbti = null;
        this.lastActiveAt = null;
    }

    /**
     * 사용자의 만 나이를 계산합니다.
     */
    public int getAge() {
        if (this.birthDate == null) return 0;
        return Period.between(birthDate, LocalDate.now()).getYears();
    }

    /**
     * 사용자 프로필 정보를 업데이트합니다.
     */
    public void updateProfile(UserProfileUpdateRequestDto dto) {

        if(dto.getNickname() != null && !dto.getNickname().isBlank()) {
            this.nickname = dto.getNickname();
        }

        if (dto.getBirthDate() != null) {
            this.birthDate = dto.getBirthDate();
        }

        if (dto.getGender() != null) {
            this.gender = dto.getGender();
        }

        if (dto.getRegion() != null) {
            this.region = dto.getRegion();
        }

        if (dto.getMbti() != null) {
            this.mbti = dto.getMbti();
        }

        if (dto.getIntro() != null) {
            this.intro = dto.getIntro();
        }

        if (dto.getInterestTags() != null) {
            this.interestTags = dto.getInterestTags().toArray(String[]::new);
        }
    }

    /**
     * 사용자의 관심사/가치관 설문조사 정보를 업데이트 합니다.
     */
    public void updateSurvey(UserSurveyUpdateRequestDto dto) {
        if(dto.getDetailedInfo() != null) {
            this.detailedInfo = dto.getDetailedInfo();
        }
    }
}
