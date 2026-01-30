package com.ssafy.unblur.domain.auth.dto.response;

import lombok.Builder;

@Builder
public record TokenReissueResponseDto(
        String accessToken,
        String refreshToken
) {
}