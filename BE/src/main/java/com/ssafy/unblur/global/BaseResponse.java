package com.ssafy.unblur.global;

import com.fasterxml.jackson.annotation.JsonProperty;

public record BaseResponse<T>(
        @JsonProperty("isSuccess")
        boolean success,
        int statusCode,
        String message,
        T data
) {
    /**
     * 성공 응답을 생성합니다.
     *
     * @param data 응답에 포함할 실제 데이터(DTO, Boolean 등)
     * @param <T>  데이터의 타입
     * @return 성공 상태, 메시지 및 데이터가 포함된 BaseResponse 객체
     */
    public static <T> BaseResponse<T> success(int statusCode, String message, T data) {
        return new BaseResponse<>(true, statusCode, message, data);
    }

    /**
     * 에러 응답을 생성합니다.
     */
    public static <T> BaseResponse<T> fail(int statusCode, String message) {
        return new BaseResponse<>(false, statusCode, message, null);
    }
}