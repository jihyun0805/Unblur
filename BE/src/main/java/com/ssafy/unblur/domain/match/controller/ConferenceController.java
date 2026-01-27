package com.ssafy.unblur.domain.match.controller;

import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.common.security.auth.CustomUserDetails;
import com.ssafy.unblur.domain.match.dto.AdvanceRoundRequest;
import com.ssafy.unblur.domain.match.dto.AdvanceRoundResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

/**
 * 세션(컨퍼런스) 라운드 관리 컨트롤러 인터페이스
 */
@Tag(name = "Matching")
public interface ConferenceController {

    /**
     * 다음 라운드 진행 API
     *
     * @param userDetails  인증 사용자 정보
     * @param conferenceId 세션 ID
     * @param request      요청 DTO
     * @return 다음 라운드 정보
     */
    @Operation(
            summary = "다음 라운드 진행",
            description = "현재 라운드가 종료된 후 다음 라운드 진행 여부를 결정합니다."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "다음 라운드 진행 성공",
                    content = @Content(schema = @Schema(implementation = AdvanceRoundResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "세션을 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = BaseResponse.class))
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "진행할 수 없는 상태 (예: 이미 종료된 세션)",
                    content = @Content(schema = @Schema(implementation = BaseResponse.class))
            )
    })
    ResponseEntity<BaseResponse<AdvanceRoundResponse>> advanceRound(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Parameter(description = "세션 ID") String conferenceId,
            AdvanceRoundRequest request
    );
}
