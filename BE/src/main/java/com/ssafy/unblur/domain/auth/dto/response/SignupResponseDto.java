package com.ssafy.unblur.domain.auth.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

@Builder
public record SignupResponseDto(
        @Schema(description = "등록된 사용자 이메일", example = "ssafy@unblur.com")
        String email
) {
}