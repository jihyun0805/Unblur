package com.ssafy.unblur.domain.match.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

/**
 * 다음 라운드 진행 응답 DTO
 */
@Builder
@Schema(description = "다음 라운드 진행 응답")
public record AdvanceRoundResponse(

        @Schema(description = "세션 ID", example = "550e8400-e29b-41d4-a716-446655440000")
        String conferenceId,

        @Schema(description = "현재 라운드 번호", example = "2")
        Integer currentRound,

        @Schema(description = "세션 상태", example = "active")
        String status
) {
}
