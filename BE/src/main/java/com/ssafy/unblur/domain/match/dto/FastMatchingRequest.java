package com.ssafy.unblur.domain.match.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.Map;

/**
 * 빠른 매칭 요청 DTO
 */
@Data
@Schema(description = "빠른 매칭 요청")
public class FastMatchingRequest {

    @Schema(description = "추가 필터 (자유 형식)")
    private Map<String, Object> filters;

}
