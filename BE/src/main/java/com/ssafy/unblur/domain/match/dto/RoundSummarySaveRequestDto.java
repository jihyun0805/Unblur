package com.ssafy.unblur.domain.match.dto;

import jakarta.validation.constraints.NotBlank;

public record RoundSummarySaveRequestDto(
        @NotBlank String summaryText
) {
}
