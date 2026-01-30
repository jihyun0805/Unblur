package com.ssafy.unblur.domain.match.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Schema(description = "상대방 선명도 평가 요청")
public record ClarityEvaluationRequest(

        @Schema(description = "평가 점수 (1~5)", example = "4")
        @NotNull
        @Min(1)
        @Max(5)
        Integer score
) {
}
