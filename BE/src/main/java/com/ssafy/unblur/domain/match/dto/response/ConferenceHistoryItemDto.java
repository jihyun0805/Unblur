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
        UUID userId,
        String nickname,
        String profileImageUrl,
        Integer clarityScore,
        String loveDna,
        Boolean isOnline,
        Boolean isBlocked
) {
}
