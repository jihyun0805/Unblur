package com.ssafy.unblur.domain.chat.dto;

public record ChatSendRequestDto(
        String type,
        String content
) {
}