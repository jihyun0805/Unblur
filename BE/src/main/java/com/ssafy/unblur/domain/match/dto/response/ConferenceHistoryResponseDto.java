package com.ssafy.unblur.domain.match.dto.response;

import lombok.Builder;

import java.util.List;

@Builder
public record ConferenceHistoryResponseDto(
        ConferenceHistorySummaryDto summary,
        List<ConferenceHistoryItemDto> items,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}