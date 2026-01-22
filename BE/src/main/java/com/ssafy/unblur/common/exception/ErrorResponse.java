package com.ssafy.unblur.common.exception;

public record ErrorResponse(
        boolean isSuccess,
        int statusCode,
        String message,
        String code
) {
    public ErrorResponse(ErrorCode errorCode) {
        this(false, errorCode.getHttpStatus().value(), errorCode.getMessage(), errorCode.getCode());
    }
}
