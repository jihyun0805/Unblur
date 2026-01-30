package com.ssafy.unblur.domain.match.dto.response;

import lombok.Builder;

@Builder
public record ConferenceHistorySummaryDto(
        long totalMatches,
        long totalMinutes,
        Integer myClarityScore
) {
}