package com.ssafy.unblur.domain.chat.dto.response;

import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

@Builder
public record ChatMessageResponseDto(
        UUID messageId,
        UUID senderId,
        String senderNickname,
        String type,
        String content,
        LocalDateTime createdAt,
        boolean isReadByPartner
) {
}