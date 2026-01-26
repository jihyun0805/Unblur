package com.ssafy.unblur.common.exception;

import io.swagger.v3.oas.annotations.media.Schema;

public record ErrorResponse(
        @Schema(description = "성공 여부", example = "false")
        boolean isSuccess,

        @Schema(description = "HTTP 상태 코드", example = "401")
        int statusCode,
        String message,
        String code
) {
    public ErrorResponse(ErrorCode errorCode) {
        this(false, errorCode.getHttpStatus().value(), errorCode.getMessage(), errorCode.getCode());
    }
}
