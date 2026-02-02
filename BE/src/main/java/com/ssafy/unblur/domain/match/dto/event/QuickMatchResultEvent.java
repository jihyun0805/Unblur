package com.ssafy.unblur.domain.match.dto.event;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * 빠른 매칭 완료 알림 DTO
 */
@Builder
@Schema(description = "빠른 매칭 완료 알림")
public record QuickMatchResultEvent(

        @Schema(description = "대기열 요청 ID", example = "queue-id")
        String requestId,

        @Schema(description = "대기열 상태", example = "matched")
        String status,

        @Schema(description = "매칭 유형", example = "quick")
        String queueType,

        @Schema(description = "매칭된 상대 사용자 ID", example = "user-id")
        String matchedUserId,

        @Schema(description = "컨퍼런스 ID", example = "conference-id")
        String conferenceId,

        @Schema(description = "매칭 완료 시각", example = "2026-01-26T14:30:00")
        LocalDateTime matchedAt,

        @Schema(description = "설문 유사도 (0.0~1.0)", example = "0.73")
        Double similarityScore
) {
}