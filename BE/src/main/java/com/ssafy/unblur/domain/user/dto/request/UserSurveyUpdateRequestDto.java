package com.ssafy.unblur.domain.user.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

import java.util.List;
import java.util.Map;

@Builder
public record UserSurveyUpdateRequestDto(
    @Schema(description = "설문 상세 데이터 (JSON 형식)", example = "[{\"QuestionId\": \"1\", \"Answer\": \"B\"}, {\"QuestionId\": \"2\", \"Answer\": \"A\"}]")
    List<Map<String, Object>> detailedInfo
) {
}