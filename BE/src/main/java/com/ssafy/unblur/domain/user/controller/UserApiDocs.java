package com.ssafy.unblur.domain.user.controller;

import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.common.response.SwaggerResponses;
import com.ssafy.unblur.domain.user.dto.response.UserProfileResponseDto;
import com.ssafy.unblur.domain.user.dto.request.UserProfileUpdateRequestDto;
import com.ssafy.unblur.domain.user.dto.response.UserSurveyResponseDto;
import com.ssafy.unblur.domain.user.dto.request.UserSurveyUpdateRequestDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;

import java.util.UUID;

@Tag(name = "User", description = "사용자 정보 관리 관련 API(회원 탈퇴, 프로필 조회/수정 등)")
public interface UserApiDocs {

    /**
     * 현재 로그인된 사용자의 계정을 탈퇴 처리합니다.
     *
     * @param response HttpServletResponse 객체 (Refresh Token 쿠키 삭제에 사용)
     * @return 성공 시 200 상태 코드와 함께 메시지를 반환
     */
    @Operation(summary = "회원 탈퇴", description = "현재 로그인된 사용자의 계정을 탈퇴 처리합니다.")
    @ApiResponse(responseCode = "200", description = "회원 탈퇴 성공", content = @Content(schema = @Schema(implementation = SwaggerResponses.VoidResponse.class)))
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
            responseCode = "400",
            description = "사용자를 찾을 수 없음",
            content = @Content(schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 400,
                              "message": "사용자를 찾을 수 없습니다.",
                              "errorCode": "USER-001"
                            }
                            """)
            )
    )
    ResponseEntity<BaseResponse<Void>> withdraw(HttpServletResponse response);

    /**
     * 현재 로그인된 사용자의 프로필 정보를 조회합니다.
     *
     * @return 성공 시 200 상태 코드와 함께 사용자 프로필 정보를 반환
     */
    @Operation(summary = "내 프로필 조회", description = "현재 로그인된 사용자의 프로필 정보를 조회합니다.")
    @ApiResponse(responseCode = "200", description = "프로필 조회 성공", content = @Content(schema = @Schema(implementation = SwaggerResponses.ProfileResponse.class)))
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
            description = "비활성화된 계정",
            content = @Content(
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                            "isSuccess": false,
                            "statusCode": 403,
                            "message": "비활성화된 계정입니다.",
                            "errorCode": "USER-005"
                            }
                            """)
            )
    )
    @ApiResponse(
            responseCode = "400",
            description = "사용자를 찾을 수 없음",
            content = @Content(schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 400,
                              "message": "사용자를 찾을 수 없습니다.",
                              "errorCode": "USER-001"
                            }
                            """)
            )
    )
    ResponseEntity<BaseResponse<UserProfileResponseDto>> getMyProfile();

    @Operation(summary = "내 프로필 수정", description = "현재 로그인된 사용자의 프로필 정보를 수정합니다.")
    @ApiResponse(responseCode = "200", description = "프로필 수정 성공", content = @Content(schema = @Schema(implementation = SwaggerResponses.ProfileResponse.class)))
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
            description = "비활성화된 계정",
            content = @Content(
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                            "isSuccess": false,
                            "statusCode": 403,
                            "message": "비활성화된 계정입니다.",
                            "errorCode": "USER-005"
                            }
                            """)
            )
    )
    @ApiResponse(
            responseCode = "400",
            description = "사용자를 찾을 수 없음",
            content = @Content(schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 400,
                              "message": "사용자를 찾을 수 없습니다.",
                              "errorCode": "USER-001"
                            }
                            """)
            )
    )
    ResponseEntity<BaseResponse<UserProfileResponseDto>> updateMyProfile(UserProfileUpdateRequestDto dto);

    @Operation(summary = "설문조사 정보 조회", description = "현재 로그인된 사용자의 설문조사 정보를 조회합니다.")
    @ApiResponse(responseCode = "200", description = "설문조사 조회 성공", content = @Content(schema = @Schema(implementation = SwaggerResponses.SurveyResponse.class)))
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
            description = "비활성화된 계정",
            content = @Content(
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                            "isSuccess": false,
                            "statusCode": 403,
                            "message": "비활성화된 계정입니다.",
                            "errorCode": "USER-005"
                            }
                            """)
            )
    )
    @ApiResponse(
            responseCode = "400",
            description = "사용자를 찾을 수 없음",
            content = @Content(schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 400,
                              "message": "사용자를 찾을 수 없습니다.",
                              "errorCode": "USER-001"
                            }
                            """)
            )
    )
    ResponseEntity<BaseResponse<UserSurveyResponseDto>> getMySurvey();

    @Operation(summary = "설문조사 수정", description = "현재 로그인된 사용자의 설문조사 정보를 수정합니다.")
    @ApiResponse(responseCode = "200", description = "설문조사 수정 성공", content = @Content(schema = @Schema(implementation = SwaggerResponses.SurveyUpdateResponse.class)))
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
            description = "비활성화된 계정",
            content = @Content(
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                            "isSuccess": false,
                            "statusCode": 403,
                            "message": "비활성화된 계정입니다.",
                            "errorCode": "USER-005"
                            }
                            """)
            )
    )
    @ApiResponse(
            responseCode = "400",
            description = "사용자를 찾을 수 없음",
            content = @Content(schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 400,
                              "message": "사용자를 찾을 수 없습니다.",
                              "errorCode": "USER-001"
                            }
                            """)
            )
    )
    ResponseEntity<BaseResponse<UserSurveyResponseDto>> updateMySurvey(UserSurveyUpdateRequestDto dto);

    /**
     * 특정 사용자를 차단합니다.
     */
    @Operation(summary = "사용자 차단", description = "특정 사용자를 차단 목록에 추가합니다.")
    @ApiResponse(responseCode = "200", description = "사용자 차단 성공", content = @Content(schema = @Schema(implementation = SwaggerResponses.VoidResponse.class)))
    @ApiResponse(
            responseCode = "400",
            description = "자기 자신 차단 시도",
            content = @Content(
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 400,
                              "message": "자기 자신은 차단할 수 없습니다.",
                              "errorCode": "USER-006"
                            }
                            """)
            )
    )
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
            description = "비활성화된 계정",
            content = @Content(
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                            "isSuccess": false,
                            "statusCode": 403,
                            "message": "비활성화된 계정입니다.",
                            "errorCode": "USER-005"
                            }
                            """)
            )
    )
    @ApiResponse(
            responseCode = "400",
            description = "사용자를 찾을 수 없음",
            content = @Content(schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 400,
                              "message": "사용자를 찾을 수 없습니다.",
                              "errorCode": "USER-001"
                            }
                            """)
            )
    )
    @ApiResponse(
            responseCode = "409",
            description = "이미 차단된 사용자",
            content = @Content(
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 409,
                              "message": "이미 차단한 사용자입니다.",
                              "errorCode": "USER-007"
                            }
                            """)
            )
    )
    ResponseEntity<BaseResponse<Void>> blockUser(UUID user_id);

    /**
     * 특정 사용자의 차단을 해제합니다.
     */
    @Operation(summary = "사용자 차단 해제", description = "차단 목록에서 특정 사용자를 제거합니다.")
    @ApiResponse(responseCode = "200", description = "차단 해제 성공", content = @Content(schema = @Schema(implementation = SwaggerResponses.VoidResponse.class)))
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
            description = "비활성화된 계정",
            content = @Content(
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                            "isSuccess": false,
                            "statusCode": 403,
                            "message": "비활성화된 계정입니다.",
                            "errorCode": "USER-005"
                            }
                            """)
            )
    )
    @ApiResponse(
            responseCode = "400",
            description = "사용자 또는 차단 정보를 찾을 수 없음",
            content = @Content(
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = {
                            @ExampleObject(name = "사용자를 찾을 수 없음", value = """
                                    {
                                      "isSuccess": false,
                                      "statusCode": 400,
                                      "message": "사용자를 찾을 수 없습니다.",
                                      "errorCode": "USER-001"
                                    }
                                    """),
                            @ExampleObject(name = "차단 목록에 없는 사용자", value = """
                                    {
                                      "isSuccess": false,
                                      "statusCode": 400,
                                      "message": "차단 목록에 존재하지 않는 사용자입니다.",
                                      "errorCode": "USER-008"
                                    }
                                    """)
                    }
            )
    )
    ResponseEntity<BaseResponse<Void>> unblockUser(UUID user_id);
}
