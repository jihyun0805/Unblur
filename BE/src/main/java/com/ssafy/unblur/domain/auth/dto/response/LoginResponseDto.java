package com.ssafy.unblur.domain.auth.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

@Builder
@Schema(description = "로그인 응답 DTO")
public record LoginResponseDto(
        @Schema(description = "Access Token (JWT)", example = "eyJhbGciOiJIUzI1NiJ9...")
        String accessToken
) {
}