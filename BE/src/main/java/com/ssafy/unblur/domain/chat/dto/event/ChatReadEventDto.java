package com.ssafy.unblur.domain.chat.dto.event;

import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

@Builder
public record ChatReadEventDto(
        String type,
        UUID conferenceId,
        UUID readerId,
        LocalDateTime lastReadAt
) {
}