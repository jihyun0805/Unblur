package com.ssafy.unblur.domain.match.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

/**
 * 1:1 매칭 요청 DTO
 */
@Builder
@Schema(description = "1:1 매칭 요청")
public record OneOnOneMatchRequest(

    @NotBlank(message = "대상 사용자 ID는 필수 입력값입니다.")
    @Schema(
            description = "대상 사용자 ID",
            example = "0f4d8f6a-8df6-4fa9-9b9d-2b3bcd0b7b8f",
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    String targetUserId
) {
}