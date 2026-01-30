package com.ssafy.unblur.domain.chat.dto.response;

import lombok.Builder;

import java.util.List;

@Builder
public record ChatMessagePageResponseDto(
        List<ChatMessageResponseDto> items,
        int page,
        int size,
        long totalElements,
        int totalPages,
        String conferenceStatus
) {
}