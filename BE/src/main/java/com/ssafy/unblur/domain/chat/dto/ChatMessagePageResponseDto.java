package com.ssafy.unblur.domain.chat.dto;

import java.util.List;

public record ChatMessagePageResponseDto(
        List<ChatMessageResponseDto> items,
        int page,
        int size,
        long totalElements,
        int totalPages,
        String conferenceStatus
) {
}