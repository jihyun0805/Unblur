package com.ssafy.unblur.domain.chat.dto.request;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record ChatReadRequestDto(
        LocalDateTime lastReadAt
) {
}