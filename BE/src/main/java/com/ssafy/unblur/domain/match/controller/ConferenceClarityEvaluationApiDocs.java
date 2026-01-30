package com.ssafy.unblur.domain.match.controller;

import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.domain.match.dto.ClarityEvaluationRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;

import java.util.UUID;

@Tag(name = "Conference", description = "세션 관련 API")
public interface ConferenceClarityEvaluationApiDocs {

    @Operation(
            summary = "상대방 선명도 평가",
            description = "세션 종료 이후 상대방 선명도를 1~5점으로 평가합니다. (1점=-2, 5점=+2)"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "평가 성공",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = BaseResponse.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "isSuccess": true,
                                      "statusCode": 200,
                                      "message": "선명도 평가 성공"
                                    }""")
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 요청",
                    content = @Content(
                            schema = @Schema(implementation = BaseResponse.class),
                            examples = {
                                    @ExampleObject(name = "세션을 찾을 수 없음", value = """
                                            {
                                              "isSuccess": false,
                                              "statusCode": 400,
                                              "message": "세션을 찾을 수 없습니다.",
                                              "errorCode": "CONF-001"
                                            }"""),
                                    @ExampleObject(name = "잘못된 점수", value = """
                                            {
                                              "isSuccess": false,
                                              "statusCode": 400,
                                              "message": "잘못된 요청 값입니다.",
                                              "errorCode": "COMMON-002"
                                            }""")
                            }
                    )
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "권한 없음 (세션 미참여자)",
                    content = @Content(
                            schema = @Schema(implementation = BaseResponse.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "isSuccess": false,
                                      "statusCode": 403,
                                      "message": "해당 세션의 참여자가 아닙니다.",
                                      "errorCode": "CONF-002"
                                    }""")
                    )
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "이미 평가됨 또는 세션 미종료",
                    content = @Content(
                            schema = @Schema(implementation = BaseResponse.class),
                            examples = {
                                    @ExampleObject(name = "이미 평가됨", value = """
                                            {
                                              "isSuccess": false,
                                              "statusCode": 409,
                                              "message": "이미 선명도 평가를 완료했습니다.",
                                              "errorCode": "EVAL-001"
                                            }"""),
                                    @ExampleObject(name = "세션 미종료", value = """
                                            {
                                              "isSuccess": false,
                                              "statusCode": 409,
                                              "message": "아직 종료되지 않은 세션입니다.",
                                              "errorCode": "CONF-005"
                                            }""")
                            }
                    )
            )
    })
    ResponseEntity<BaseResponse<Void>> evaluateClarity(
            UUID conferenceId,
            @RequestBody ClarityEvaluationRequest request
    );
}
