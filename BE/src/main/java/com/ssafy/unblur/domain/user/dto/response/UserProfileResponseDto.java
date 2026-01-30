package com.ssafy.unblur.domain.user.dto.response;

import com.ssafy.unblur.domain.auth.model.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Builder
public record UserProfileResponseDto(
    @Schema(description = "사용자 고유 ID", example = "550e8400-e29b-41d4-a716-446655440000")
    UUID id,

    @Schema(description = "이메일 주소", example = "ssafy@unblur.com")
    String email,

    @Schema(description = "닉네임", example = "언블러")
    String nickname,

    @Schema(description = "계산된 현재 나이", example = "25")
    Integer age, // birthDate를 기반으로 계산된 값

    @Schema(description = "생년월일", example = "2000-01-01")
    String birthDate,

    @Schema(description = "성별 (MALE, FEMALE)", example = "MALE")
    String gender,

    @Schema(description = "활동 지역", example = "SEOUL", nullable = true)
    String region,

    @Schema(description = "MBTI 유형", example = "ENFJ", nullable = true)
    String mbti,

    @Schema(description = "연애 성향 유형", example = "EFPD", nullable = true)
    String loveDna,

    @Schema(description = "한 줄 소개 (자기소개)", example = "반갑습니다!", nullable = true)
    String intro,

    @Schema(description = "설문 상세 데이터 (JSON 형식)", example = "[{\"QuestionId\": \"1\", \"Answer\": \"B\"}, {\"QuestionId\": \"2\", \"Answer\": \"A\"}]")
    List<Map<String, Object>> detailedInfo,

    @Schema(description = "관심사 태그 목록", example = "[\"코딩\", \"등산\", \"영화\"]")
    List<String> interestTags,

    @Schema(description = "선명도 점수 (0~100)", example = "50")
    Integer clarityScore
) {

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
                .loveDna(user.getLoveDna() != null ? user.getLoveDna().name() : null)
                .intro(user.getIntro())
                .detailedInfo(user.getDetailedInfo())
                .interestTags(user.getInterestTags())
                .clarityScore(user.getClarityScore())
                .build();
    }
}
