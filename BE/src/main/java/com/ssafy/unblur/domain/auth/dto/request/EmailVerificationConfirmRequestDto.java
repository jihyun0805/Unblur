package com.ssafy.unblur.domain.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record EmailVerificationConfirmRequestDto(
        @NotBlank(message = "이메일은 필수 입력값입니다.")
        @Email(message = "유효한 이메일 형식이 아닙니다.")
        @Schema(description = "이메일", example = "ssafy@unblur.com")
        String email,

        @NotBlank(message = "인증 코드는 필수 입력값입니다.")
        @Pattern(regexp = "^\\d{8}$", message = "인증 코드는 숫자 8자리여야 합니다.")
        @Schema(description = "인증 코드", example = "12345678")
        String code
) {
}
