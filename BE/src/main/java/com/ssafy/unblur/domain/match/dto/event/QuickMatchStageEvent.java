package com.ssafy.unblur.domain.match.dto.event;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * 빠른 매칭 단계 알림 DTO
 */
@Builder
@Schema(description = "빠른 매칭 단계 알림")
public record QuickMatchStageEvent(

        @Schema(description = "대기열 요청 ID", example = "queue-id")
        String requestId,

        @Schema(description = "매칭 단계", example = "relaxed")
        String stage,

        @Schema(description = "적용 임계치", example = "0.5")
        Double threshold,

        @Schema(description = "단계 전환 시각", example = "2026-01-26T14:30:00")
        LocalDateTime occurredAt
) {
}