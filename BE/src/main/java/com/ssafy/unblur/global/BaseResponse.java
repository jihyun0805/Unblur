package com.ssafy.unblur.global;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
@JsonAutoDetect(fieldVisibility = JsonAutoDetect.Visibility.ANY, getterVisibility = JsonAutoDetect.Visibility.NONE)
public class BaseResponse<T> {
    @JsonProperty("isSuccess")
    private final boolean success;

    private final int statusCode;
    private final String message;
    private final T data;

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
}