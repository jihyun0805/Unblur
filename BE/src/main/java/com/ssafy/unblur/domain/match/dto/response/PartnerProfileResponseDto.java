package com.ssafy.unblur.domain.match.dto.response;

import com.ssafy.unblur.domain.auth.model.User;
import lombok.Builder;

import java.util.List;

@Builder
public record PartnerProfileResponseDto(
        String nickname,
        Integer clarityScore,
        Integer age,
        String gender,
        String region,
        String mbti,
        String intro,
        List<String> interestTags,
        List<RoundSummaryDto> roundSummaries
) {
    @Builder
    public record RoundSummaryDto(
            Integer roundNumber,
            String summaryText
    ) {
    }

    public static PartnerProfileResponseDto from(User user) {
        return from(user, List.of());
    }

    public static PartnerProfileResponseDto from(User user, List<RoundSummaryDto> roundSummaries) {
        return new PartnerProfileResponseDto(
                user.getNickname(),
                user.getClarityScore(),
                user.getAge(),
                user.getGender().name(),
                user.getRegion() != null ? user.getRegion().name() : null,
                user.getMbti() != null ? user.getMbti().name() : null,
                user.getIntro(),
                user.getInterestTags(),
                roundSummaries
        );
    }
}