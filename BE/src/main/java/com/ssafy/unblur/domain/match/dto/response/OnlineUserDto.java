package com.ssafy.unblur.domain.match.dto.response;

import com.ssafy.unblur.domain.auth.model.Gender;
import com.ssafy.unblur.domain.auth.model.LoveDna;
import com.ssafy.unblur.domain.auth.model.Mbti;
import com.ssafy.unblur.domain.auth.model.Region;
import com.ssafy.unblur.domain.auth.model.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

import java.util.List;
import java.util.UUID;

/**
 * 온라인 사용자 미리보기 DTO
 */
@Builder
@Schema(description = "온라인 사용자 정보")
public record OnlineUserDto(

    @Schema(description = "사용자 ID", example = "550e8400-e29b-41d4-a716-446655440000")
    UUID id,

    @Schema(description = "닉네임", example = "언블러")
    String nickname,

    @Schema(description = "나이", example = "25")
    Integer age,

    @Schema(description = "성별", example = "MALE")
    Gender gender,

    @Schema(description = "지역", example = "SEOUL")
    Region region,

    @Schema(description = "MBTI", example = "INTJ")
    Mbti mbti,

    @Schema(description = "연애 성향 유형", example = "EFPD")
    LoveDna loveDna,

    @Schema(description = "한 줄 소개", example = "안녕하세요! 만나서 반가워요.")
    String intro,

    @Schema(description = "관심 태그", example = "[\"여행\", \"음악\", \"독서\"]")
    List<String> interestTags,

    @Schema(description = "선명도 점수", example = "50")
    Integer clarityScore
) {
    public static OnlineUserDto from(User user) {
        return new OnlineUserDto(
                user.getId(),
                user.getNickname(),
                user.getAge(),
                user.getGender(),
                user.getRegion(),
                user.getMbti(),
                user.getLoveDna(),
                user.getIntro(),
                user.getInterestTags(),
                user.getClarityScore()
        );
    }
}