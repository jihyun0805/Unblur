package com.ssafy.unblur.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.bind.MethodArgumentNotValidException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final String REQUEST_LOG_FORMAT = "[{}] {} {} - {}";

    /**
     * 애플리케이션 표준 예외 응답 생성.
     * <p>
     * {@link BaseException}의 {@link BaseException#getErrorCode()}를 기준으로 HTTP 상태를 결정하고,
     * 예외 메시지는 로깅에만 활용
     * </p>
     * <p><b>로그 예시</b></p>
     * <ul>
     *   <li>4xx(예상 오류): {@code [USER-001] GET /api/v1/users/me - 사용자를 찾을 수 없습니다.}</li>
     *   <li>5xx(서버 오류): {@code [COMMON-001] POST /api/v1/users - 서버 내부 오류가 발생했습니다.} (stacktrace 포함)</li>
     * </ul>
     *
     * @param e 처리 대상 예외
     * @param request 요청 정보
     * @return 표준 에러 응답({@link ErrorResponse})을 포함한 {@link ResponseEntity}
     */
    @ExceptionHandler(BaseException.class)
    public ResponseEntity<ErrorResponse> handleUserException(BaseException e, HttpServletRequest request) {

        HttpStatus httpStatus = e.getHttpStatus();

        if (httpStatus.is5xxServerError()) {
            logError(e.getErrorCode(), request, e.getMessage(), e);
        } else {
            logWarn(e.getErrorCode(), request, e.getMessage());
        }

        ErrorResponse response = new ErrorResponse(e.getErrorCode());
        return ResponseEntity
                .status(httpStatus)
                .body(response);
    }

    /**
     * 입력 검증/바인딩/파싱 실패 예외 응답 생성.
     * <p>
     * 입력 문제를 {@link ErrorCode#INVALID_INPUT_VALUE}로 통일하여 400 응답을 반환
     * </p>
     * <p><b>로그 예시</b></p>
     * <ul>
     *   <li>{@link BindException}: {@code [COMMON-002] POST /api/v1/users - email: 이메일 형식이 아닙니다, age: 0 이상이어야 합니다}</li>
     *   <li>{@link HttpMessageNotReadableException}: {@code [COMMON-002] POST /api/v1/users - 요청 본문 형식을 확인해주세요.}</li>
     *   <li>{@link HandlerMethodValidationException}: {@code [COMMON-002] GET /api/v1/users/me - 잘못된 입력 값입니다.} (또는 스프링 기본 메시지)</li>
     * </ul>
     *
     * @param e 처리 대상 예외
     * @param request 요청 정보
     * @return 입력 오류 안내를 포함한 400 응답
     */
    @ExceptionHandler({
            BindException.class,
            MethodArgumentNotValidException.class,
            HandlerMethodValidationException.class,
            HttpMessageNotReadableException.class,
            ConstraintViolationException.class
    })
    public ResponseEntity<ErrorResponse> handleInvalidInput(Exception e, HttpServletRequest request) {
        String logDetail = summarizeInvalidInput(e);
        logInfo(request, logDetail);

        ErrorResponse response = new ErrorResponse(ErrorCode.INVALID_INPUT_VALUE);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException e, HttpServletRequest request) {
        logWarn(ErrorCode.ACCESS_DENIED, request, e.getMessage());
        ErrorResponse response = new ErrorResponse(ErrorCode.ACCESS_DENIED);
        return ResponseEntity
                .status(ErrorCode.ACCESS_DENIED.getHttpStatus())
                .body(response);
    }

    @ExceptionHandler({
            DataIntegrityViolationException.class,
            org.hibernate.exception.ConstraintViolationException.class
    })
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(Exception e, HttpServletRequest request) {
        logError(ErrorCode.INTERNAL_SERVER_ERROR, request, e.getMessage(), e);
        ErrorResponse response = new ErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }

    /**
     * 예기치 못한 예외의 공통 응답 생성.
     * <p>
     * 사전에 분류되지 않은 모든 예외를 {@link ErrorCode#INTERNAL_SERVER_ERROR}로 처리하고 500 응답을 반환
     * </p>
     * <p><b>로그 예시</b></p>
     * <p>
     * {@code [COMMON-001] GET /api/v1/users/me - 예외 메시지} (stacktrace 포함)
     * </p>
     *
     * @param e 처리 대상 예외
     * @param request 요청 정보
     * @return 500 응답
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception e, HttpServletRequest request) {
        logError(ErrorCode.INTERNAL_SERVER_ERROR, request, e.getMessage(), e);

        ErrorResponse response = new ErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }

    /**
     * 입력 오류 예외를 로그용 요약 문자열로 변환.
     * <p>
     * 응답에는 상세 오류를 포함하지 않으므로, 운영/디버깅을 위해 로그에 남길 최소 정보만 추출
     * </p>
     *
     * @param e 처리 대상 예외
     * @return 요약 문자열(없으면 null)
     */
    private static String summarizeInvalidInput(Exception e) {
        if (e instanceof BindException bindException) {
            return bindException.getBindingResult().getFieldErrors().stream()
                    .map(fieldError -> fieldError.getField() + ": " + fieldError.getDefaultMessage())
                    .reduce((left, right) -> left + ", " + right)
                    .orElse("잘못된 입력 값입니다.");
        }

        if (e instanceof HttpMessageNotReadableException) {
            return "요청 본문 형식을 확인해주세요.";
        }

        String message = e.getMessage();
        return (message == null || message.isBlank()) ? "잘못된 입력 값입니다." : message;
    }

    private static void logInfo(HttpServletRequest request, String detail) {
        log.info(REQUEST_LOG_FORMAT, ErrorCode.INVALID_INPUT_VALUE.getCode(), request.getMethod(), request.getRequestURI(), detail);
    }

    private static void logWarn(ErrorCode errorCode, HttpServletRequest request, String detail) {
        log.warn(REQUEST_LOG_FORMAT, errorCode.getCode(), request.getMethod(), request.getRequestURI(), detail);
    }

    private static void logError(ErrorCode errorCode, HttpServletRequest request, String detail, Throwable throwable) {
        log.error(REQUEST_LOG_FORMAT, errorCode.getCode(), request.getMethod(), request.getRequestURI(), detail, throwable);
    }
}
