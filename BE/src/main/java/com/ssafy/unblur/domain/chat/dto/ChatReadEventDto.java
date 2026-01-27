package com.ssafy.unblur.domain.chat.dto;

import java.time.LocalDateTime;

public record ChatReadEventDto(
        LocalDateTime readAt
) {
}