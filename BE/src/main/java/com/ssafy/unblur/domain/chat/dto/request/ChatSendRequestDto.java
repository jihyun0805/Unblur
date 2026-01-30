package com.ssafy.unblur.domain.chat.dto.request;

import lombok.Builder;

@Builder
public record ChatSendRequestDto(
        String content
) {
}