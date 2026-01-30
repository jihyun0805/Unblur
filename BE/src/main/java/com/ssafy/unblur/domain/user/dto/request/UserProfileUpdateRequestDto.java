package com.ssafy.unblur.domain.user.dto.request;

import com.ssafy.unblur.domain.auth.model.Gender;
import com.ssafy.unblur.domain.auth.model.Mbti;
import com.ssafy.unblur.domain.auth.model.Region;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

import java.time.LocalDate;
import java.util.List;

@Builder
public record UserProfileUpdateRequestDto(

    @Schema(description = "닉네임 (최대 10자)", example = "언블러")
    String nickname,

    @Schema(description = "생년월일", example = "2000-01-01")
    LocalDate birthDate,

    @Schema(description = "성별 (MALE/FEMALE)", example = "MALE")
    Gender gender,

    @Schema(description = "지역 정보", example = "SEOUL")
    Region region,

    @Schema(description = "MBTI 유형", example = "ENFJ")
    Mbti mbti,

    @Schema(description = "한 줄 소개 (자기소개)", example = "반갑습니다!", nullable = true)
    String intro,

    @Schema(description = "관심사 태그 목록", example = "[\"코딩\"]")
    List<String> interestTags
) {
}