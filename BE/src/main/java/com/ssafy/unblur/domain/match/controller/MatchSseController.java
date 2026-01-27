package com.ssafy.unblur.domain.match.controller;

import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.common.security.auth.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Tag(name = "Matching", description = "매칭 관련 SSE API")
@SecurityRequirement(name = "bearerAuth")
public interface MatchSseController {

    /**
     * 빠른 매칭 상태 스트림을 구독하는 API
     */
    @Operation(
            summary = "매칭 상태 스트림 구독",
            description = "빠른 매칭 단계/완료 이벤트를 SSE로 수신합니다."
    )
    @ApiResponse(
            responseCode = "200",
            description = "SSE 연결 성공",
            content = @Content(mediaType = "text/event-stream")
    )
    @ApiResponse(
            responseCode = "401",
            description = "로그인이 필요합니다.",
            content = @Content(
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 401,
                              "message": "로그인이 필요합니다.",
                              "errorCode": "AUTH-007"
                            }""")
            )
    )
    @ApiResponse(
            responseCode = "403",
            description = "접근 권한이 없습니다.",
            content = @Content(
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 403,
                              "message": "접근 권한이 없습니다.",
                              "errorCode": "AUTH-008"
                            }""")
            )
    )
    @ApiResponse(
            responseCode = "409",
            description = "이미 SSE 연결이 열려있습니다.",
            content = @Content(
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 409,
                              "message": "이미 SSE 연결이 열려 있습니다.",
                              "errorCode": "MATCH-006"
                            }""")
            )
    )
    SseEmitter connect(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails
    );
}
