package com.ssafy.unblur.domain.chat.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ChatReadEventDto(
        List<UUID> messageIds,
        LocalDateTime readAt
) {
}