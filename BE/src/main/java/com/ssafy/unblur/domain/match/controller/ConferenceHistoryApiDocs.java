package com.ssafy.unblur.domain.match.controller;

import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.domain.match.dto.ConferenceHistoryResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

@Tag(name = "History", description = "대화방 이력 조회 API")
public interface ConferenceHistoryApiDocs {

    @Operation(summary = "대화방 이력 조회", description = "로그인된 사용자가 참여한 대화방 이력을 페이지로 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    @Parameter(name = "page", description = "페이지 번호 (0부터 시작)", example = "0")
    @Parameter(name = "size", description = "페이지 크기", example = "20")
    ResponseEntity<BaseResponse<ConferenceHistoryResponseDto>> getMyConferenceHistory(@Parameter(hidden = true) Pageable pageable);
}