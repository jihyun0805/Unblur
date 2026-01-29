package com.ssafy.unblur.domain.match.dto;

import com.ssafy.unblur.domain.auth.model.Gender;
import com.ssafy.unblur.domain.auth.model.Mbti;
import com.ssafy.unblur.domain.auth.model.Region;
import com.ssafy.unblur.domain.auth.model.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.UUID;

/**
 * 온라인 사용자 미리보기 DTO
 */
@Getter
@Builder
@Schema(description = "온라인 사용자 정보")
public class OnlineUserDto {

    @Schema(description = "사용자 ID", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID id;

    @Schema(description = "닉네임", example = "언블러")
    private String nickname;

    @Schema(description = "나이", example = "25")
    private Integer age;

    @Schema(description = "성별", example = "MALE")
    private Gender gender;

    @Schema(description = "지역", example = "SEOUL")
    private Region region;

    @Schema(description = "MBTI", example = "INTJ")
    private Mbti mbti;

    @Schema(description = "한 줄 소개", example = "안녕하세요! 만나서 반가워요.")
    private String intro;

    @Schema(description = "관심 태그", example = "[\"여행\", \"음악\", \"독서\"]")
    private List<String> interestTags;

    @Schema(description = "선명도 점수", example = "50")
    private Integer clarityScore;

    public static OnlineUserDto from(User user) {
        return OnlineUserDto.builder()
                .id(user.getId())
                .nickname(user.getNickname())
                .age(user.getAge())
                .gender(user.getGender())
                .region(user.getRegion())
                .mbti(user.getMbti())
                .intro(user.getIntro())
                .interestTags(user.getInterestTags())
                .clarityScore(user.getClarityScore())
                .build();
    }
}
