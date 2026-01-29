package com.ssafy.unblur.domain.match.controller;

import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.domain.match.dto.ConferenceHistoryResponseDto;
import com.ssafy.unblur.domain.match.dto.PartnerProfileResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import java.util.UUID;

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

    @Operation(summary = "상대방 프로필 조회", description = "소개팅 이력에서 상대방의 프로필을 조회합니다.")
    @ApiResponse(responseCode = "200", description = "상대방 프로필 조회 성공")
    @ApiResponse(
            responseCode = "401",
            description = "인증되지 않은 사용자",
            content = @Content(
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                            "isSuccess": false,
                            "statusCode": 401,
                            "message": "로그인이 필요합니다.",
                            "errorCode": "AUTH-007"
                            }
                            """)
            )
    )
    @ApiResponse(
            responseCode = "403",
            description = "권한 없음 (비활성 계정 또는 세션 미참여자)",
            content = @Content(
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = {
                            @ExampleObject(name = "비활성화된 계정", value = """
                            {
                              "isSuccess": false,
                              "statusCode": 403,
                              "message": "비활성화된 계정입니다.",
                              "errorCode": "USER-005"
                            }
                            """),
                            @ExampleObject(name = "해당 세션의 참여자가 아님", value = """
                            {
                              "isSuccess": false,
                              "statusCode": 403,
                              "message": "해당 세션의 참여자가 아닙니다.",
                              "errorCode": "CONF-002"
                            }
                            """)
                    }
            )
    )
    @ApiResponse(
            responseCode = "400",
            description = "정보를 찾을 수 없음",
            content = @Content(
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = {
                            @ExampleObject(name = "세션을 찾을 수 없음", value = """
                            {
                              "isSuccess": false,
                              "statusCode": 400,
                              "message": "세션을 찾을 수 없습니다.",
                              "errorCode": "CONF-001"
                            }
                            """),
                            @ExampleObject(name = "상대방을 찾을 수 없음", value = """
                            {
                              "isSuccess": false,
                              "statusCode": 400,
                              "message": "상대방 사용자를 찾을 수 없습니다.",
                              "errorCode": "USER-001"
                            }
                            """)
                    }
            )
    )
    ResponseEntity<BaseResponse<PartnerProfileResponseDto>> getPartnerProfile(UUID conferenceId);
}