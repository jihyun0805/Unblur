package com.ssafy.unblur.domain.user.dto;

import com.ssafy.unblur.domain.auth.model.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;

@Getter
@Builder
@AllArgsConstructor
public class UserSurveyResponseDto {
    @Schema(description = "설문 상세 데이터 (JSON 형식)", example = "[{\"QuestionId\": \"1\", \"Answer\": \"B\"}, {\"QuestionId\": \"2\", \"Answer\": \"A\"}]")
    private List<Map<String, Object>> surveyData; // User 엔티티의 detailedInfo와 매핑

    public static UserSurveyResponseDto from(User user) {
        return UserSurveyResponseDto.builder()
                .surveyData(user.getDetailedInfo())
                .build();
    }
}
