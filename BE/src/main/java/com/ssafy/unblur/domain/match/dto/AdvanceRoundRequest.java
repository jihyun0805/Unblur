package com.ssafy.unblur.domain.match.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

/**
 * 다음 라운드 진행 요청 DTO
 */
@Schema(description = "다음 라운드 진행 요청")
public record AdvanceRoundRequest(

        @Schema(description = "다음 라운드 진행 여부", example = "true")
        @NotNull
        Boolean proceed
) {
}
