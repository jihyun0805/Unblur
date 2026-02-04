package com.ssafy.unblur.domain.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PasswordResetRequestDto(
        @NotBlank(message = "이메일은 필수 입력값입니다.")
        @Email(message = "유효한 이메일 형식이 아닙니다.")
        @Schema(description = "이메일", example = "ssafy@unblur.com")
        String email,

        @NotBlank(message = "인증 코드는 필수 입력값입니다.")
        @Pattern(regexp = "^\\d{8}$", message = "인증 코드는 숫자 8자리여야 합니다.")
        @Schema(description = "인증 코드", example = "12345678")
        String code,

        @NotBlank(message = "새 비밀번호는 필수 입력값입니다.")
        @Size(min = 9, max = 16, message = "비밀번호는 9자 이상 16자 이하여야 합니다.")
        @Pattern(
                regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{9,16}$",
                message = "비밀번호는 영문, 숫자, 특수문자를 최소 하나 이상 포함해야 합니다."
        )
        @Schema(description = "새 비밀번호(영문, 숫자, 특수문자 포함 9~16자)", example = "unblur123!")
        String newPassword
) {
}
