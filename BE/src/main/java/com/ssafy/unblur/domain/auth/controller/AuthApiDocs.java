package com.ssafy.unblur.domain.auth.controller;

import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.common.response.SwaggerResponses;
import com.ssafy.unblur.domain.auth.dto.LoginRequestDto;
import com.ssafy.unblur.domain.auth.dto.LoginResponseDto;
import com.ssafy.unblur.domain.auth.dto.SignupDto;
import com.ssafy.unblur.domain.auth.dto.SignupResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;

@Tag(name = "Auth", description = "인증 관련 API (회원가입, 중복 체크, 토큰 재발급/로그아웃 등)")
public interface AuthApiDocs {

    /**
     * 새로운 사용자를 등록합니다.
     *
     * @param signUpDto 회원가입에 필요한 정보(이메일, 비밀번호, 닉네임 등)
     * @return 성공 시 201 상태 코드와 함께 생성된 유저의 ID를 반환
     */
    @Operation(summary = "회원가입", description = "새로운 사용자를 등록합니다.")
    @ApiResponse(responseCode = "201", description = "회원가입 성공", content = @Content(schema = @Schema(implementation = SwaggerResponses.SignupResponse.class)))
    @ApiResponse(
            responseCode = "400",
            description = "유효하지 않은 입력 값 (이메일 형식 오류, 필수값 누락 등)",
            content = @Content(
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                              "isSuccess": false,
                              "statusCode": 400,
                              "message": "[COMMON-002] 입력 값이 유효하지 않습니다.",
                            }
                            """)
            )
    )
    @ApiResponse(
            responseCode = "409",
            description = "중복 오류 (이메일 또는 닉네임)",
            content = @Content(
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = {
                            @ExampleObject(
                                    name = "이메일 중복",
                                    value = """
                                            {
                                            "isSuccess": false,
                                            "statusCode": 409,
                                            "message": "이미 존재하는 이메일입니다.",
                                            "errorCode": "USER-003"
                                            }
                                            """
                            ),
                            @ExampleObject(
                                    name = "닉네임 중복",
                                    value = """
                                            {
                                            "isSuccess": false,
                                            "statusCode": 409,
                                            "message": "이미 존재하는 닉네임입니다.",
                                            "code": "USER-004"
                                            }
                                            """
                            )
                    }
            )
    )
    ResponseEntity<BaseResponse<SignupResponseDto>> signUp(@RequestBody SignupDto signUpDto);

    /**
     * 이메일 중복 여부를 확인합니다.
     *
     * @param email 중복 확인할 이메일 주소
     * @return 성공 시 200 상태 코드와 함께 중복 여부(true: 중복)를 반환
     */
    @Operation(summary = "이메일 중복 확인", description = "입력받은 이메일이 DB에 존재하는지 확인합니다.")
    @ApiResponse(responseCode = "200", description = "조회 성공 (true: 중복됨, false: 사용 가능)", content = @Content(schema = @Schema(implementation = SwaggerResponses.DuplicateCheckResponse.class)))
    ResponseEntity<BaseResponse<Boolean>> checkEmail(
            @Parameter(description = "이메일 주소", example = "test@ssafy.com")
            String email);

    /**
     * 닉네임 중복 여부를 확인합니다.
     *
     * @param nickname 중복 확인할 사용자의 닉네임
     * @return 성공 시 200 상태 코드와 함께 중복 여부(true: 중복)를 반환
     */
    @Operation(summary = "닉네임 중복 확인", description = "닉네임 중복 여부를 체크합니다.")
    @ApiResponse(responseCode = "200", description = "조회 성공 (true: 중복됨, false: 사용 가능)", content = @Content(schema = @Schema(implementation = SwaggerResponses.DuplicateCheckResponse.class)))
    ResponseEntity<BaseResponse<Boolean>> checkNickname(
            @Parameter(description = "중복 확인할 닉네임", example = "unblur")
            String nickname);

    /**
     * 사용자의 이메일과 비밀번호를 확인하여 로그인을 수행합니다.
     * 로그인 성공 시 Access Token은 응답 바디와 헤더에, Refresh Token은 HttpOnly 쿠키에 담겨 발급됩니다.
     *
     * @param loginRequest 로그인 정보(이메일, 비밀번호)를 담은 DTO
     * @param response     토큰 정보를 헤더와 쿠키에 설정하기 위한 HttpServletResponse
     * @return 성공 시 200 상태 코드와 함께 Access Token 정보를 반환
     */
    @Operation(summary = "로그인", description = "이메일과 비밀번호로 로그인합니다. 성공 시 Access Token(Body/Header)과 Refresh Token(Cookie)을 발급합니다.")
    @ApiResponse(responseCode = "200", description = "로그인 성공", content = @Content(schema = @Schema(implementation = SwaggerResponses.LoginResponse.class)))
    @ApiResponse(
            responseCode = "401",
            description = "비밀번호 불일치",
            content = @Content(
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                            "isSuccess": false,
                            "statusCode": 401,
                            "message": "아이디 또는 비밀번호가 일치하지 않습니다.",
                            "errorCode": "AUTH-002"
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
            responseCode = "404",
            description = "존재하지 않는 사용자",
            content = @Content(
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                            "isSuccess": false,
                            "statusCode": 404,
                            "message": "사용자를 찾을 수 없습니다.",
                            "errorCode": "USER-001"
                            }
                            """)
            )
    )
    ResponseEntity<BaseResponse<LoginResponseDto>> login(@RequestBody LoginRequestDto loginRequest, HttpServletResponse response);

    /**
     * Access Token을 재발행합니다.
     * 쿠키에 담긴 Refresh Token을 검증하고 새로운 Access Token을 발급하며,
     * Token Rotation 방식에 따라 Refresh Token도 함께 갱신합니다.
     *
     * @param request  Refresh Token 쿠키를 포함한 HttpServletRequest
     * @param response 새로운 Access Token(Header)과 Refresh Token(Cookie)을 설정할 HttpServletResponse
     * @return 성공 시 200 상태 코드와 함께 새로 생성된 Access Token을 반환
     */
    @Operation(summary = "토큰 재발급", description = "쿠키의 Refresh Token을 검증하여 Access Token과 Refresh Token을 모두 재발급(Rotation)합니다.")
    @ApiResponse(responseCode = "200", description = "토큰 재발급 성공", content = @Content(schema = @Schema(implementation = SwaggerResponses.RefreshTokenResponse.class)))
    @ApiResponse(
            responseCode = "401",
            description = "유효하지 않은 Refresh Token",
            content = @Content(
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                            "isSuccess": false,
                            "statusCode": 401,
                            "message": "유효하지 않은 토큰입니다.",
                            "errorCode": "AUTH-003"
                            }
                            """)
            )
    )
    @ApiResponse(
            responseCode = "401",
            description = "만료된 Refresh Token",
            content = @Content(
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                            "isSuccess": false,
                            "statusCode": 401,
                            "message": "만료된 토큰입니다.",
                            "errorCode": "AUTH-004"
                            }
                            """)
            )
    )
    @ApiResponse(
            responseCode = "404",
            description = "토큰의 사용자를 찾을 수 없음",
            content = @Content(
                    schema = @Schema(implementation = BaseResponse.class),
                    examples = @ExampleObject(value = """
                            {
                            "isSuccess": false,
                            "statusCode": 404,
                            "message": "사용자를 찾을 수 없습니다.",
                            "errorCode": "USER-001"
                            }
                            """)
            )
    )
    ResponseEntity<BaseResponse<LoginResponseDto>> reissue(
            @Parameter(hidden = true) HttpServletRequest request,
            @Parameter(hidden = true) HttpServletResponse response);


    @Operation(summary = "로그아웃", description = "현재 사용자를 로그아웃 처리합니다. 클라이언트의 Refresh Token 쿠키를 삭제하고 서버의 Refresh Token을 무효화합니다.")
    @ApiResponse(responseCode = "200", description = "로그아웃 성공", content = @Content(schema = @Schema(implementation = SwaggerResponses.VoidResponse.class)))
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
                            "code": "AUTH-007"
                            }
                            """)
            )
    )
    ResponseEntity<BaseResponse<Void>> logout(HttpServletResponse response);
}

