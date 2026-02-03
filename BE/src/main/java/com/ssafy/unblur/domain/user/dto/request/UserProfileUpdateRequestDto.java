package com.ssafy.unblur.domain.user.dto.request;

import com.ssafy.unblur.domain.auth.model.Gender;
import com.ssafy.unblur.domain.auth.model.Mbti;
import com.ssafy.unblur.domain.auth.model.Region;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.time.LocalDate;
import java.util.List;

@Builder
public record UserProfileUpdateRequestDto(

    @Size(max = 10, message = "닉네임은 최대 10자까지 가능합니다.")
    @Pattern(regexp = "^[A-Za-z0-9가-힣]{1,10}$", message = "닉네임은 한글/영문/숫자만 사용할 수 있습니다.")
    @Schema(description = "닉네임(최대 10자, 한글/영문/숫자만)", example = "호랑이")
    String nickname,

    @Schema(description = "생년월일", example = "2000-01-01")
    LocalDate birthDate,

    @Schema(description = "성별 (MALE/FEMALE)", example = "MALE")
    Gender gender,

    @Schema(description = "지역 정보", example = "SEOUL")
    Region region,

    @Schema(description = "MBTI 유형", example = "ENFJ")
    Mbti mbti,

    @Schema(description = "한 줄 자기소개(자기소개)", example = "반갑습니다.", nullable = true)
    String intro,

    @Schema(description = "관심사 태그 목록", example = "[\"코딩\"]")
    List<String> interestTags
) {
}
