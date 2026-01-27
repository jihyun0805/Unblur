package com.ssafy.unblur.common.response;

import com.ssafy.unblur.domain.auth.dto.LoginResponseDto;
import com.ssafy.unblur.domain.auth.dto.SignupResponseDto;
import com.ssafy.unblur.domain.user.dto.UserProfileResponseDto;
import com.ssafy.unblur.domain.user.dto.UserSurveyResponseDto;
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
        @Schema(description = "성공 여부", example = "true")
        public boolean isSuccess;

        @Schema(description = "상태 코드", example = "200")
        public int statusCode;

        @Schema(description = "응답 메시지", example = "이메일 중복 여부 확인 완료")
        public String message;

        @Schema(description = "중복 여부 (true: 중복됨, false: 사용 가능", example = "false")
        private Boolean data;
    }

    @Schema(description = "로그인 성공 응답")
    public static class LoginResponse extends BaseResponse<LoginResponseDto> {
        @Schema(description = "성공 여부", example = "true")
        public boolean isSuccess;

        @Schema(description = "상태 코드", example = "200")
        public int statusCode;

        @Schema(description = "응답 메시지", example = "로그인 완료")
        public String message;

        @Schema(description = "Access Token")
        private LoginResponseDto data;
    }

    @Schema(description = "토큰 재발급 응답")
    public static class RefreshTokenResponse extends BaseResponse<LoginResponseDto> {
        @Schema(description = "성공 여부", example = "true")
        public boolean isSuccess;

        @Schema(description = "상태 코드", example = "200")
        public int statusCode;

        @Schema(description = "응답 메시지", example = "토큰 재발급 완료")
        public String message;

        @Schema(description = "Access Token")
        private LoginResponseDto data;
    }

    @Schema(description = "공통 성공 응답 (데이터 없음)")
    public static class VoidResponse extends BaseResponse<Void> {


        @Schema(description = "응답 데이터 (데이터가 없는 경우 null)", example = "null")
        private Void data;
    }

    @Schema(description = "내 프로필 조회 성공")
    public static class ProfileResponse extends BaseResponse<UserProfileResponseDto> {
        @Schema(description = "성공 여부", example = "true")
        public boolean isSuccess;

        @Schema(description = "상태 코드", example = "200")
        public int statusCode;

        @Schema(description = "응답 메시지", example = "프로필 조회 성공")
        public String message;

        @Schema(description = "응답 데이터")
        private UserProfileResponseDto data;
    }

    @Schema(description = "설문조사 정보 조회 성공")
    public static class SurveyResponse extends BaseResponse<UserSurveyResponseDto> {
        @Schema(description = "성공 여부", example = "true")
        public boolean isSuccess;

        @Schema(description = "상태 코드", example = "200")
        public int statusCode;

        @Schema(description = "응답 메시지", example = "설문조사 정보 조회 성공")
        public String message;

        @Schema(description = "응답 데이터")
        private UserSurveyResponseDto data;
    }
}