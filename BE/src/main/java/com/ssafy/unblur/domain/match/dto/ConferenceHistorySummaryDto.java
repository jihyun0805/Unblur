package com.ssafy.unblur.domain.match.dto;

public record ConferenceHistorySummaryDto(
        long totalMatches,
        long totalMinutes,
        Integer myClarityScore
) {
}

