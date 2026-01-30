package com.ssafy.unblur.domain.game.controller;

import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.domain.game.dto.QuestionDictionaryResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

@Tag(name = "Question", description = "추천 질문 조회 API")
public interface QuestionDictionaryApiDocs {

    @Operation(summary = "매칭용 라운드별 랜덤 질문 조회", description = "각 라운드(ROUND_1, ROUND_2, ROUND_3_4)별로 랜덤 질문 5개씩 조회합니다.")
    @ApiResponse(responseCode = "200", description = "질문 조회 성공")
    ResponseEntity<BaseResponse<Map<String, List<QuestionDictionaryResponseDto>>>> getMatchQuestions();
}
