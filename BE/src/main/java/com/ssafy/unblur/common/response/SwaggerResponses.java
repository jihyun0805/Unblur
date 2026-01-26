package com.ssafy.unblur.common.response;

import com.ssafy.unblur.domain.auth.dto.LoginResponseDto;
import com.ssafy.unblur.domain.auth.dto.SignupResponseDto;
import com.ssafy.unblur.domain.user.dto.UserProfileResponseDto;
import io.swagger.v3.oas.annotations.media.Schema;

public class SwaggerResponses {

    @Schema(description = "회원가입 성공 응답")
    public static class SignupResponse extends BaseResponse<SignupResponseDto> {
        @Schema(description = "성공 여부", example = "true")
        public boolean isSuccess;

        @Schema(description = "상태 코드", example = "201")
        public int statusCode;

        @Schema(description = "응답 메시지", example = "회원가입 완료")
        public String message;

        @Schema(description = "응답 데이터")
        public SignupResponse data;
    }

    @Schema(description = "중복 체크 응답")
    public static class DuplicateCheckResponse extends BaseResponse<Boolean> {
        @Schema(description = "중복 여부 (true: 중복됨, false: 사용 가능", example = "false")
        private Boolean data;
    }

    @Schema(description = "로그인 성공 응답")
    public static class LoginResponse extends BaseResponse<LoginResponseDto> {}

    @Schema(description = "내 프로필 조회 성공")
    public static class ProfileResponse extends BaseResponse<UserProfileResponseDto> {}

    @Schema(description = "공통 성공 응답 (데이터 없음)")
    public static class VoidResponse extends BaseResponse<Void> {}
}