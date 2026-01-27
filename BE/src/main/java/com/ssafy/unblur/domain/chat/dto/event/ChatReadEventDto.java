package com.ssafy.unblur.domain.chat.dto.event;

import java.time.LocalDateTime;

public record ChatReadEventDto(
        LocalDateTime readAt
) {
}