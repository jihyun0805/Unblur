package com.ssafy.unblur.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.ssafy.unblur.common.exception.ErrorCode;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "공통 응답 포맷")
public class BaseResponse<T> {

    @Schema(description = "성공 여부", example = "true")
    @JsonProperty("isSuccess")
    private boolean success;

    @Schema(description = "상태 코드", example = "200")
    private int statusCode;

    @Schema(description = "응답 메시지", example = "요청에 성공하였습니다.")
    private String message;

    @Schema(description = "데이터 결과")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private T data; // 성공했을 때 반환할 데이터

    @Schema(description = "에러 코드", example = "USER_NOT_FOUND")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String errorCode; // 실패했을 때 반환할 반환할 데이터

    public static <T> BaseResponse<T> onSuccess(String message, T data) {
        return new BaseResponse<>(true, 200, message, data, null);
    }

    public static <T> BaseResponse<T> onCreate(String message, T data) {
        return new BaseResponse<>(true, 201, message, data, null);
    }

    public static <T> BaseResponse<T> onFailure(ErrorCode errorCode) {
        return new BaseResponse<>(false, errorCode.getHttpStatus().value(), errorCode.getMessage(), null, errorCode.getCode());
    }

}