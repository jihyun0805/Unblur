package com.ssafy.unblur.domain.match.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * 1:1 매칭 완료 응답 DTO
 */
@Builder
@Schema(description = "1:1 매칭 완료 응답")
public record OneOnOneMatchedResponse(
        @Schema(description = "대기열 요청 ID", example = "queue-id")
        String requestId,

        @Schema(description = "회의 ID", example = "550e8400-e29b-41d4-a716-446655440000")
        String conferenceId,

        @Schema(description = "상대 사용자 ID", example = "0f4d8f6a-8df6-4fa9-9b9d-2b3bcd0b7b8f")
        String targetUserId,

        @Schema(description = "매칭 완료 시각", example = "2024-01-14T14:30:00")
        LocalDateTime matchedAt
) {
}