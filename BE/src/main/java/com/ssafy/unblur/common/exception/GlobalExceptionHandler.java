package com.ssafy.unblur.common.exception;

import com.ssafy.unblur.common.response.BaseResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
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
     * ?좏뵆由ъ??댁뀡 ?쒖? ?덉쇅 ?묐떟 ?앹꽦?섎뒗 硫붿꽌??
     */
    @ExceptionHandler(BaseException.class)
    public ResponseEntity<BaseResponse> handleUserException(BaseException e, HttpServletRequest request) {
        HttpStatus httpStatus = e.getHttpStatus();
        setErrorMdc(e.getErrorCode(), httpStatus);

        if (httpStatus.is5xxServerError()) {
            logError(e.getErrorCode(), request, e.getMessage(), e);
        } else {
            logWarn(e.getErrorCode(), request, e.getMessage());
        }

        BaseResponse response = BaseResponse.onFailure(e.getErrorCode());
        return ResponseEntity
                .status(httpStatus)
                .body(response);
    }

    /**
     * ?낅젰 寃利?諛붿씤???뚯떛 ?ㅽ뙣 ?덉쇅 ?묐떟 ?앹꽦.
     * <p>
     * ?낅젰 臾몄젣瑜?{@link ErrorCode#INVALID_INPUT_VALUE}濡??듭씪?섏뿬 400 ?묐떟??諛섑솚
     * </p>
     * <p><b>濡쒓렇 ?덉떆</b></p>
     * <ul>
     *   <li>{@link BindException}: {@code [COMMON-002] POST /api/v1/users - email: ?대찓???뺤떇???꾨떃?덈떎, age: 0 ?댁긽?댁뼱???⑸땲??</li>
     *   <li>{@link HttpMessageNotReadableException}: {@code [COMMON-002] POST /api/v1/users - ?붿껌 蹂몃Ц ?뺤떇???뺤씤?댁＜?몄슂.}</li>
     *   <li>{@link HandlerMethodValidationException}: {@code [COMMON-002] GET /api/v1/users/me - ?섎せ???낅젰 媛믪엯?덈떎.} (?먮뒗 ?ㅽ봽留?湲곕낯 硫붿떆吏)</li>
     * </ul>
     *
     * @param e       泥섎━ ????덉쇅
     * @param request ?붿껌 ?뺣낫
     * @return ?낅젰 ?ㅻ쪟 ?덈궡瑜??ы븿??400 ?묐떟
     */
    @ExceptionHandler({
            BindException.class,
            MethodArgumentNotValidException.class,
            HandlerMethodValidationException.class,
            HttpMessageNotReadableException.class,
            ConstraintViolationException.class
    })
    public ResponseEntity<BaseResponse> handleInvalidInput(Exception e, HttpServletRequest request) {
        String logDetail = summarizeInvalidInput(e);
        setErrorMdc(ErrorCode.INVALID_INPUT_VALUE, HttpStatus.BAD_REQUEST);
        logInfo(request, logDetail);

        BaseResponse response = BaseResponse.onFailure(ErrorCode.INVALID_INPUT_VALUE);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<BaseResponse> handleAccessDenied(AccessDeniedException e, HttpServletRequest request) {
        setErrorMdc(ErrorCode.ACCESS_DENIED, ErrorCode.ACCESS_DENIED.getHttpStatus());
        logWarn(ErrorCode.ACCESS_DENIED, request, e.getMessage());

        BaseResponse response = BaseResponse.onFailure(ErrorCode.ACCESS_DENIED);
        return ResponseEntity
                .status(ErrorCode.ACCESS_DENIED.getHttpStatus())
                .body(response);
    }

    @ExceptionHandler({
            DataIntegrityViolationException.class,
            org.hibernate.exception.ConstraintViolationException.class
    })
    public ResponseEntity<BaseResponse> handleDataIntegrityViolation(Exception e, HttpServletRequest request) {
        setErrorMdc(ErrorCode.INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
        logError(ErrorCode.INTERNAL_SERVER_ERROR, request, e.getMessage(), e);

        BaseResponse response = BaseResponse.onFailure(ErrorCode.INTERNAL_SERVER_ERROR);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }

    /**
     * ?덇린移?紐삵븳 ?덉쇅??怨듯넻 ?묐떟 ?앹꽦.
     * <p>
     * ?ъ쟾??遺꾨쪟?섏? ?딆? 紐⑤뱺 ?덉쇅瑜?{@link ErrorCode#INTERNAL_SERVER_ERROR}濡?泥섎━?섍퀬 500 ?묐떟??諛섑솚
     * </p>
     * <p><b>濡쒓렇 ?덉떆</b></p>
     * <p>
     * {@code [COMMON-001] GET /api/v1/users/me - ?덉쇅 硫붿떆吏} (stacktrace ?ы븿)
     * </p>
     *
     * @param e       泥섎━ ????덉쇅
     * @param request ?붿껌 ?뺣낫
     * @return 500 ?묐떟
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<BaseResponse> handleException(Exception e, HttpServletRequest request) {
        setErrorMdc(ErrorCode.INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
        logError(ErrorCode.INTERNAL_SERVER_ERROR, request, e.getMessage(), e);

        BaseResponse response = BaseResponse.onFailure(ErrorCode.INTERNAL_SERVER_ERROR);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }

    /**
     * ?낅젰 ?ㅻ쪟 ?덉쇅瑜?濡쒓렇???붿빟 臾몄옄?대줈 蹂??
     * <p>
     * ?묐떟?먮뒗 ?곸꽭 ?ㅻ쪟瑜??ы븿?섏? ?딆쑝誘濡? ?댁쁺/?붾쾭源낆쓣 ?꾪빐 濡쒓렇???④만 理쒖냼 ?뺣낫留?異붿텧
     * </p>
     *
     * @param e 泥섎━ ????덉쇅
     * @return ?붿빟 臾몄옄???놁쑝硫?null)
     */
    private static String summarizeInvalidInput(Exception e) {
        if (e instanceof BindException bindException) {
            return bindException.getBindingResult().getFieldErrors().stream()
                    .map(fieldError -> fieldError.getField() + ": " + fieldError.getDefaultMessage())
                    .reduce((left, right) -> left + ", " + right)
                    .orElse("?섎せ???낅젰 媛믪엯?덈떎.");
        }

        if (e instanceof HttpMessageNotReadableException) {
            return "?붿껌 蹂몃Ц ?뺤떇???뺤씤?댁＜?몄슂.";
        }

        String message = e.getMessage();
        return (message == null || message.isBlank()) ? "?섎せ???낅젰 媛믪엯?덈떎." : message;
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

    private static void setErrorMdc(ErrorCode errorCode, HttpStatus status) {
        MDC.put("status", String.valueOf(status.value()));
        MDC.put("errorCode", errorCode.getCode());
    }
}
