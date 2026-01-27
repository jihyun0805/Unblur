package com.ssafy.unblur.domain.match.controller;

import com.ssafy.unblur.common.exception.ErrorResponse;
import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.common.security.auth.CustomUserDetails;
import com.ssafy.unblur.domain.match.dto.FastMatchingRequest;
import com.ssafy.unblur.domain.match.dto.MatchingQueueResponse;
import com.ssafy.unblur.domain.match.dto.OneOnOneMatchRequest;
import com.ssafy.unblur.domain.match.dto.OneOnOneMatchResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;

@Tag(name = "Matching", description = "매칭 관련 API")
@SecurityRequirement(name = "bearerAuth")
public interface MatchController {

    /**
     * 빠른 매칭 요청 API
     */
    @Operation(
            summary = "빠른 매칭 요청",
            description = "필터 조건을 기반으로 매칭 대기열에 등록합니다.",
            requestBody = @RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = FastMatchingRequest.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "filters": {"ageMin": 24, "ageMax": 32}
                                    }"""))
            )
    )
    @ApiResponse(
            responseCode = "200",
            description = "등록 성공",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": true,
                              "statusCode": 200,
                              "message": "OK",
                              "data": {
                                "requestId": "queue-id",
                                "status": "waiting",
                                "isQueued": true,
                                "position": 5,
                                "estimatedWaitSeconds": 300,
                                "queueType": "quick",
                                "waitingCount": 128,
                                "queuedAt": "2024-01-14T14:30:00"
                              }
                            }"""))
    )
    @ApiResponse(
            responseCode = "400",
            description = "잘못된 요청",
            content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 400,
                              "message": "잘못된 요청 값입니다.",
                              "code": "COMMON-002"
                            }""")
            )
    )
    @ApiResponse(
            responseCode = "401",
            description = "로그인이 필요합니다.",
            content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 401,
                              "message": "로그인이 필요합니다.",
                              "code": "AUTH-007"
                            }""")
            )
    )
    @ApiResponse(
            responseCode = "409",
            description = "이미 대기열에 등록됨",
            content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 409,
                              "message": "이미 대기열에 등록되어 있습니다.",
                              "code": "MATCH-002"
                            }""")
            )
    )
    ResponseEntity<BaseResponse<MatchingQueueResponse>> startQuickMatch(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody FastMatchingRequest request
    );

    /**
     * 1:1 매칭 요청 API
     */
    @Operation(
            summary = "1:1 매칭 요청",
            description = "상대와 1:1 매칭을 요청합니다.",
            requestBody = @RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = OneOnOneMatchRequest.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "targetUserId": "0f4d8f6a-8df6-4fa9-9b9d-2b3bcd0b7b8f"
                                    }"""))
            )
    )
    @ApiResponse(
            responseCode = "200",
            description = "등록 성공",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": true,
                              "statusCode": 200,
                              "message": "OK",
                              "data": {
                                "requestId": "queue-id",
                                "status": "waiting",
                                "queueType": "one-on-one",
                                "targetUserId": "0f4d8f6a-8df6-4fa9-9b9d-2b3bcd0b7b8f",
                                "targetStatus": "pending",
                                "estimatedWaitSeconds": 60,
                                "queuedAt": "2024-01-14T14:30:00"
                              }
                            }"""))
    )
    @ApiResponse(
            responseCode = "400",
            description = "잘못된 요청",
            content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 400,
                              "message": "잘못된 요청 값입니다.",
                              "code": "COMMON-002"
                            }""")
            )
    )
    @ApiResponse(
            responseCode = "401",
            description = "로그인이 필요합니다.",
            content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 401,
                              "message": "로그인이 필요합니다.",
                              "code": "AUTH-007"
                            }""")
            )
    )
    @ApiResponse(
            responseCode = "404",
            description = "대상 사용자를 찾을 수 없음",
            content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 404,
                              "message": "대상 사용자를 찾을 수 없습니다.",
                              "code": "MATCH-003"
                            }""")
            )
    )
    @ApiResponse(
            responseCode = "409",
            description = "이미 대기열에 등록됨",
            content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 409,
                              "message": "이미 대기열에 등록되어 있습니다.",
                              "code": "MATCH-002"
                            }""")
            )
    )
    @ApiResponse(
            responseCode = "409",
            description = "상대가 현재 수락 불가(오프라인)",
            content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 409,
                              "message": "상대가 현재 수락할 수 없는 상태입니다.",
                              "code": "MATCH-005"
                            }""")
            )
    )
    ResponseEntity<BaseResponse<OneOnOneMatchResponse>> startOneOnOneMatch(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody OneOnOneMatchRequest request
    );


    /**
     * 매칭 대기 현황 조회 API
     */
    @Operation(
            summary = "매칭 대기 현황",
            description = "현재 로그인 사용자의 매칭 대기 상태와 전체 대기 인원을 조회합니다."
    )
    @ApiResponse(
            responseCode = "200",
            description = "조회 성공",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": true,
                              "statusCode": 200,
                              "message": "OK",
                              "data": {
                                "requestId": "queue-id",
                                "status": "waiting",
                                "isQueued": true,
                                "position": 8,
                                "estimatedWaitSeconds": 480,
                                "queueType": "quick",
                                "waitingCount": 128,
                                "queuedAt": "2024-01-14T14:30:00"
                              }
                            }"""))
    )
    @ApiResponse(
            responseCode = "401",
            description = "로그인이 필요합니다.",
            content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 401,
                              "message": "로그인이 필요합니다.",
                              "code": "AUTH-007"
                            }""")
            )
    )
    @ApiResponse(
            responseCode = "404",
            description = "대기열 요청을 찾을 수 없음",
            content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 404,
                              "message": "매칭 요청을 찾을 수 없습니다.",
                              "code": "MATCH-001"
                            }""")
            )
    )
    ResponseEntity<BaseResponse<MatchingQueueResponse>> getQueueStatus(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails
    );

    /**
     * 매칭 취소 API
     */
    @Operation(
            summary = "매칭 취소",
            description = "대기 중인 매칭 요청을 취소합니다."
    )
    @ApiResponse(
            responseCode = "200",
            description = "취소 성공",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": true,
                              "statusCode": 200,
                              "message": "OK",
                              "data": {}
                            }"""))
    )
    @ApiResponse(
            responseCode = "400",
            description = "잘못된 요청",
            content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 400,
                              "message": "잘못된 요청 값입니다.",
                              "code": "COMMON-002"
                            }""")
            )
    )
    @ApiResponse(
            responseCode = "401",
            description = "로그인이 필요합니다.",
            content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 401,
                              "message": "로그인이 필요합니다.",
                              "code": "AUTH-007"
                            }""")
            )
    )
    @ApiResponse(
            responseCode = "404",
            description = "매칭 요청을 찾을 수 없음",
            content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 404,
                              "message": "매칭 요청을 찾을 수 없습니다.",
                              "code": "MATCH-001"
                            }""")
            )
    )
    ResponseEntity<BaseResponse<Object>> cancelQuickMatch(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
            @Parameter(description = "매칭 요청 ID", example = "0f4d8f6a-8df6-4fa9-9b9d-2b3bcd0b7b8f")
            @PathVariable("request_id") String requestId
    );

    /**
     * 1:1 매칭 수락 API
     */
    @Operation(
            summary = "1:1 매칭 수락",
            description = "대상 사용자만 상대의 1:1 매칭 요청을 수락할 수 있습니다."
    )
    @ApiResponse(
            responseCode = "200",
            description = "수락 성공",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": true,
                              "statusCode": 200,
                              "message": "OK",
                              "data": {
                                "requestId": "queue-id",
                                "status": "matched",
                                "queueType": "one-on-one",
                                "targetUserId": "0f4d8f6a-8df6-4fa9-9b9d-2b3bcd0b7b8f",
                                "targetStatus": "accepted",
                                "estimatedWaitSeconds": null,
                                "queuedAt": "2024-01-14T14:30:00"
                              }
                            }"""))
    )
    @ApiResponse(
            responseCode = "400",
            description = "잘못된 요청",
            content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 400,
                              "message": "잘못된 요청 값입니다.",
                              "code": "COMMON-002"
                            }""")
            )
    )
    @ApiResponse(
            responseCode = "401",
            description = "로그인이 필요합니다.",
            content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 401,
                              "message": "로그인이 필요합니다.",
                              "code": "AUTH-007"
                            }""")
            )
    )
    @ApiResponse(
            responseCode = "403",
            description = "대상 사용자만 수락할 수 있음",
            content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 403,
                              "message": "해당 기능에 접근할 권한이 없습니다.",
                              "code": "AUTH-008"
                            }""")
            )
    )
    @ApiResponse(
            responseCode = "404",
            description = "매칭 요청을 찾을 수 없음",
            content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 404,
                              "message": "매칭 요청을 찾을 수 없습니다.",
                              "code": "MATCH-001"
                            }""")
            )
    )
    @ApiResponse(
            responseCode = "409",
            description = "이미 처리된 매칭 요청",
            content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 409,
                              "message": "이미 처리된 매칭 요청입니다.",
                              "code": "MATCH-004"
                            }""")
            )
    )
    ResponseEntity<BaseResponse<OneOnOneMatchResponse>> acceptOneOnOne(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
            @Parameter(description = "매칭 요청 ID", example = "0f4d8f6a-8df6-4fa9-9b9d-2b3bcd0b7b8f")
            @PathVariable("request_id") String requestId
    );

    /**
     * 1:1 매칭 거절 API
     */
    @Operation(
            summary = "1:1 매칭 거절",
            description = "대상 사용자만 상대의 1:1 매칭 요청을 거절할 수 있습니다."
    )
    @ApiResponse(
            responseCode = "200",
            description = "거절 성공",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": true,
                              "statusCode": 200,
                              "message": "OK",
                              "data": {
                                "requestId": "queue-id",
                                "status": "canceled",
                                "queueType": "one-on-one",
                                "targetUserId": "0f4d8f6a-8df6-4fa9-9b9d-2b3bcd0b7b8f",
                                "targetStatus": "declined",
                                "estimatedWaitSeconds": null,
                                "queuedAt": "2024-01-14T14:30:00"
                              }
                            }"""))
    )
    @ApiResponse(
            responseCode = "400",
            description = "잘못된 요청",
            content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 400,
                              "message": "잘못된 요청 값입니다.",
                              "code": "COMMON-002"
                            }""")
            )
    )
    @ApiResponse(
            responseCode = "401",
            description = "로그인이 필요합니다.",
            content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 401,
                              "message": "로그인이 필요합니다.",
                              "code": "AUTH-007"
                            }""")
            )
    )
    @ApiResponse(
            responseCode = "403",
            description = "대상 사용자만 거절할 수 있음",
            content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 403,
                              "message": "해당 기능에 접근할 권한이 없습니다.",
                              "code": "AUTH-008"
                            }""")
            )
    )
    @ApiResponse(
            responseCode = "404",
            description = "매칭 요청을 찾을 수 없음",
            content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 404,
                              "message": "매칭 요청을 찾을 수 없습니다.",
                              "code": "MATCH-001"
                            }""")
            )
    )
    @ApiResponse(
            responseCode = "409",
            description = "이미 처리된 매칭 요청",
            content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 409,
                              "message": "이미 처리된 매칭 요청입니다.",
                              "code": "MATCH-004"
                            }""")
            )
    )
    ResponseEntity<BaseResponse<OneOnOneMatchResponse>> declineOneOnOne(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
            @Parameter(description = "매칭 요청 ID", example = "0f4d8f6a-8df6-4fa9-9b9d-2b3bcd0b7b8f")
            @PathVariable("request_id") String requestId
    );
}
