package com.ssafy.unblur.common.response;

import com.ssafy.unblur.domain.auth.dto.LoginResponseDto;
import com.ssafy.unblur.domain.auth.dto.SignupResponseDto;
import com.ssafy.unblur.domain.user.dto.UserProfileResponseDto;
import io.swagger.v3.oas.annotations.media.Schema;

public class SwaggerResponses {

    @Schema(description = "회원가입 성공 응답")
    public static class SignupResponse extends BaseResponse<SignupResponseDto> {}

    @Schema(description = "로그인 성공 응답")
    public static class LoginResponse extends BaseResponse<LoginResponseDto> {}

    @Schema(description = "내 프로필 조회 성공")
    public static class ProfileResponse extends BaseResponse<UserProfileResponseDto> {}

    @Schema(description = "공통 성공 응답 (데이터 없음)")
    public static class VoidResponse extends BaseResponse<Void> {}
}