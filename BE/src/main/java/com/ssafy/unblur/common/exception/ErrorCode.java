package com.ssafy.unblur.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "USER-001", "사용자를 찾을 수 없습니다."),
    DUPLICATE_LOGIN(HttpStatus.CONFLICT, "USER-002", "이미 존재하는 로그인 ID입니다."),
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "USER-003", "이미 존재하는 이메일입니다."),
    DUPLICATE_NICKNAME(HttpStatus.CONFLICT, "USER-004", "이미 존재하는 닉네임입니다."),
    INACTIVE_USER(HttpStatus.FORBIDDEN, "USER-005", "비활성화된 계정입니다."),

    INVALID_SOCIAL_SIGNUP_STATE(HttpStatus.BAD_REQUEST, "AUTH-001", "소셜 회원가입 상태가 올바르지 않습니다."),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "AUTH-002", "아이디 또는 비밀번호가 일치하지 않습니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH-003", "유효하지 않은 토큰입니다."),
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH-004", "만료된 토큰입니다."),
    REUSED_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH-005", "이미 폐기된 리프레시 토큰입니다."),
    USER_PROFILE_INCOMPLETE(HttpStatus.BAD_REQUEST, "AUTH-006", "추가 가입 정보가 아직 부족합니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "AUTH-007", "로그인이 필요합니다."),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "AUTH-008", "해당 기능에 접근할 권한이 없습니다."),
    INVALID_EMAIL_FORMAT(HttpStatus.BAD_REQUEST, "AUTH-009", "유효하지 않은 이메일 형식입니다."),

    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON-001", "서버 내부 오류가 발생했습니다."),
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "COMMON-002", "잘못된 요청 값입니다."),
    NOTNULL_INPUT_VALUE(HttpStatus.BAD_REQUEST, "COMMON-003", "필수 입력 값이 누락되었습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
