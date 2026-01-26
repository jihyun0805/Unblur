package com.ssafy.unblur.common.response;

import com.fasterxml.jackson.annotation.JsonProperty;
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
        private T data;

    public BaseResponse(int statusCode, String message, T data) {
        this(true, statusCode, message, data);
    }
}