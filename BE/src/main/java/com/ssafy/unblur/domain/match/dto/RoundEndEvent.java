package com.ssafy.unblur.domain.match.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * 라운드 종료 알림 DTO
 */
@Builder
@Schema(description = "라운드 종료 알림")
public record RoundEndEvent(

        @Schema(description = "세션 ID", example = "550e8400-e29b-41d4-a716-446655440000")
        String conferenceId,

        @Schema(description = "종료된 라운드 번호", example = "1")
        Integer roundNumber,

        @Schema(description = "라운드 종료 시각", example = "2026-01-27T14:30:00")
        LocalDateTime endedAt
) {
}
