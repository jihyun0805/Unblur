package com.ssafy.unblur.domain.match.dto;

import java.util.List;

public record ConferenceHistoryResponseDto(
        ConferenceHistorySummaryDto summary,
        List<ConferenceHistoryItemDto> items,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}

