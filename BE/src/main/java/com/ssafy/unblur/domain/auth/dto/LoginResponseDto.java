package com.ssafy.unblur.domain.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Schema(description = "로그인 응답 DTO")
public class LoginResponseDto {
    @Schema(description = "Access Token (JWT)", example = "eyJhbGciOiJIUzI1NiJ9...")
    private String accessToken;
}
