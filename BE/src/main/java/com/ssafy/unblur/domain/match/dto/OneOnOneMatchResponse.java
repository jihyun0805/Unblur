package com.ssafy.unblur.domain.match.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

/**
 * 1:1 매칭 응답 DTO
 */
@Schema(description = "1:1 매칭 응답")
public record OneOnOneMatchResponse(
        @Schema(description = "대기열 요청 ID", example = "queue-id")
        String requestId,

        @Schema(description = "대기열 상태", example = "waiting")
        String status,

        @Schema(description = "매칭 유형", example = "one-on-one")
        String queueType,

        @Schema(description = "상대 사용자 ID", example = "0f4d8f6a-8df6-4fa9-9b9d-2b3bcd0b7b8f")
        String targetUserId,

        @Schema(description = "상대방 수락 상태", example = "pending")
        String targetStatus,

        @Schema(description = "예상 대기 시간(초, 없으면 null)", example = "60")
        Integer estimatedWaitSeconds,

        @Schema(description = "대기열 등록 시각", example = "2024-01-14T14:30:00")
        LocalDateTime queuedAt
) {
}
