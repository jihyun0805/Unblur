package com.ssafy.unblur.domain.user.dto.response;

import com.ssafy.unblur.domain.auth.model.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

import java.util.List;
import java.util.Map;

@Builder
public record UserSurveyResponseDto(
    @Schema(description = "설문 상세 데이터 (JSON 형식)", example = "[{\"QuestionId\": \"1\", \"Answer\": \"B\"}, {\"QuestionId\": \"2\", \"Answer\": \"A\"}]")
    List<Map<String, Object>> detailedInfo
) {

    public static UserSurveyResponseDto from(User user) {
        return new UserSurveyResponseDto(user.getDetailedInfo());
    }
}