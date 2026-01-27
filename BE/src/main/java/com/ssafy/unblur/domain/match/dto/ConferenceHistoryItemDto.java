package com.ssafy.unblur.domain.match.dto;

import java.time.LocalDate;
import java.util.UUID;

public record ConferenceHistoryItemDto(
        UUID conferenceId,
        Integer currentRound,
        LocalDate createdDate,
        long durationMinutes,
        String partnerName,
        String partnerProfileImageUrl,
        Integer partnerClarityScore
) {
}

