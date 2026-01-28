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
    CANNOT_BLOCK_SELF(HttpStatus.BAD_REQUEST, "USER-006", "자기 자신은 차단할 수 없습니다."),
    ALREADY_BLOCKED(HttpStatus.CONFLICT, "USER-007", "이미 차단한 사용자입니다."),
    NOT_BLOCKED_USER(HttpStatus.NOT_FOUND, "USER-008", "차단 목록에 존재하지 않는 사용자입니다."),

    INVALID_SOCIAL_SIGNUP_STATE(HttpStatus.BAD_REQUEST, "AUTH-001", "소셜 회원가입 상태가 올바르지 않습니다."),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "AUTH-002", "아이디 또는 비밀번호가 일치하지 않습니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH-003", "유효하지 않은 토큰입니다."),
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH-004", "만료된 토큰입니다."),
    REUSED_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH-005", "이미 폐기된 리프레시 토큰입니다."),
    USER_PROFILE_INCOMPLETE(HttpStatus.BAD_REQUEST, "AUTH-006", "추가 가입 정보가 아직 부족합니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "AUTH-007", "로그인이 필요합니다."),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "AUTH-008", "해당 기능에 접근할 권한이 없습니다."),
    INVALID_EMAIL_FORMAT(HttpStatus.BAD_REQUEST, "AUTH-009", "유효하지 않은 이메일 형식입니다."),

    ICE_CANDIDATE_SEND_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "RTC-001", "ICE candidate 전송에 실패했습니다."),
    USER_NOT_JOINED(HttpStatus.FORBIDDEN, "RTC-002", "방에 참여하지 않은 사용자입니다."),

    MATCH_REQUEST_NOT_FOUND(HttpStatus.NOT_FOUND, "MATCH-001", "매칭 요청을 찾을 수 없습니다."),
    MATCH_ALREADY_QUEUED(HttpStatus.CONFLICT, "MATCH-002", "이미 대기열에 등록되어 있습니다."),
    MATCH_TARGET_NOT_FOUND(HttpStatus.NOT_FOUND, "MATCH-003", "대상 사용자를 찾을 수 없습니다."),
    MATCH_ALREADY_HANDLED(HttpStatus.CONFLICT, "MATCH-004", "이미 처리된 매칭 요청입니다."),
    MATCH_TARGET_OFFLINE(HttpStatus.CONFLICT, "MATCH-005", "상대가 현재 수락할 수 없는 상태입니다."),

    CONFERENCE_NOT_FOUND(HttpStatus.NOT_FOUND, "CONF-001", "세션을 찾을 수 없습니다."),
    CONFERENCE_NOT_PARTICIPANT(HttpStatus.FORBIDDEN, "CONF-002", "해당 세션의 참여자가 아닙니다."),
    CONFERENCE_ALREADY_COMPLETED(HttpStatus.CONFLICT, "CONF-003", "이미 종료된 세션입니다."),
    CONFERENCE_MAX_ROUND_REACHED(HttpStatus.CONFLICT, "CONF-004", "최대 라운드에 도달했습니다."),

    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON-001", "서버 내부 오류가 발생했습니다."),
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "COMMON-002", "잘못된 요청 값입니다."),
    NOTNULL_INPUT_VALUE(HttpStatus.BAD_REQUEST, "COMMON-003", "필수 입력 값이 누락되었습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
