package com.ssafy.unblur.domain.chat.dto.event;

import java.time.LocalDateTime;
import java.util.UUID;

public record ChatReadEventDto(
        String type,
        UUID conferenceId,
        UUID readerId,
        LocalDateTime lastReadAt
) {
}