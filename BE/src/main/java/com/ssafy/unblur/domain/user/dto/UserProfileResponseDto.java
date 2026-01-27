package com.ssafy.unblur.domain.user.dto;

import com.ssafy.unblur.domain.auth.model.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class UserProfileResponseDto {
    @Schema(description = "사용자 고유 ID", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID id;

    @Schema(description = "이메일 주소", example = "ssafy@unblur.com")
    private String email;

    @Schema(description = "닉네임", example = "언블러")
    private String nickname;

    @Schema(description = "계산된 현재 나이", example = "25")
    private Integer age; // birthDate를 기반으로 계산된 값

    @Schema(description = "생년월일", example = "2000-01-01")
    private String birthDate;

    @Schema(description = "성별 (MALE, FEMALE)", example = "MALE")
    private String gender;

    @Schema(description = "활동 지역", example = "SEOUL", nullable = true)
    private String region;

    @Schema(description = "MBTI 유형", example = "ENFJ", nullable = true)
    private String mbti;

    @Schema(description = "한 줄 소개 (자기소개)", example = "반갑습니다!", nullable = true)
    private String bio; // User 엔티티의 intro와 매핑

    @Schema(description = "설문 상세 데이터 (JSON 형식)", example = "{'산과 바다 중에 어디가 좋으신가요?' : '둘 다', '전화와 카톡 중 어떤 걸 선호하시나요?' : '카톡'}")
    private Object surveyData; // User 엔티티의 detailedInfo와 매핑

    @Schema(description = "관심사 태그 목록", example = "[\"코딩\", \"등산\", \"영화\"]")
    private String[] interestTags;

    @Schema(description = "선명도 점수 (0~100)", example = "50")
    private Integer clarityScore;

    public static UserProfileResponseDto from(User user) {
        return UserProfileResponseDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .age(user.getAge())
                .birthDate(user.getBirthDate().toString())
                .gender(user.getGender().name())
                .region(user.getRegion() != null ? user.getRegion().name() : null)
                .mbti(user.getMbti() != null ? user.getMbti().name() : null)
                .bio(user.getIntro())
                .surveyData(user.getDetailedInfo())
                .interestTags(user.getInterestTags())
                .clarityScore(user.getClarityScore())
                .build();
    }
}
