package com.ssafy.unblur.domain.match.dto.response;

import lombok.Builder;

import java.time.LocalDate;
import java.util.UUID;

@Builder
public record ConferenceHistoryItemDto(
        UUID conferenceId,
        Integer currentRound,
        LocalDate createdDate,
        long durationMinutes,
        long unreadCount,
        String partnerName,
        String partnerProfileImageUrl,
        Integer partnerClarityScore,
        Boolean partnerOnline
) {
}
