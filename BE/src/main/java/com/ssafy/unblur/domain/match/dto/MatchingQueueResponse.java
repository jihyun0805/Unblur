package com.ssafy.unblur.domain.match.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * 매칭 대기열 등록 결과 DTO
 */
@Builder
@Schema(description = "매칭 대기열 등록 결과")
public record MatchingQueueResponse(

        @Schema(description = "대기열 요청 ID", example = "queue-id")
        String requestId,

        @Schema(description = "대기열 상태", example = "waiting")
        String status,

        @Schema(description = "대기열 등록 여부", example = "true")
        Boolean isQueued,

        @Schema(description = "내 대기 순번 (없으면 null)", example = "5")
        Integer position,

        @Schema(description = "예상 대기 시간(초, 없으면 null)", example = "300")
        Integer estimatedWaitSeconds,

        @Schema(description = "매칭 유형", example = "quick")
        String queueType,

        @Schema(description = "현재 대기 인원", example = "128")
        int waitingCount,

        @Schema(description = "대기열 등록 시각", example = "2024-01-14T14:30:00")
        LocalDateTime queuedAt
) {
}
