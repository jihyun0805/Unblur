package com.ssafy.unblur.domain.match.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

import java.util.Map;

/**
 * 빠른 매칭 요청 DTO
 */
@Builder
@Schema(description = "빠른 매칭 요청")
public record FastMatchingRequest(

    @Schema(description = "추가 필터 (자유 형식)")
    Map<String, Object> filters
) {
}