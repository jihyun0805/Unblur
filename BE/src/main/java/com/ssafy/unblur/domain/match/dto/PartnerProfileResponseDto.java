package com.ssafy.unblur.domain.match.dto;

import com.ssafy.unblur.domain.auth.model.User;

import java.util.List;

public record PartnerProfileResponseDto(
        String nickname,
        Integer clarityScore,
        Integer age,
        String gender,
        String region,
        String mbti,
        String intro,
        List<String> interestTags
) {
    public static PartnerProfileResponseDto from(User user) {
        return new PartnerProfileResponseDto(
                user.getNickname(),
                user.getClarityScore(),
                user.getAge(),
                user.getGender().name(),
                user.getRegion() != null ? user.getRegion().name() : null,
                user.getMbti() != null ? user.getMbti().name() : null,
                user.getIntro(),
                user.getInterestTags()
        );
    }
}
