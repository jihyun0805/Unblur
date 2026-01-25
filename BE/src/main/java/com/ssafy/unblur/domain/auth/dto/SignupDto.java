package com.ssafy.unblur.domain.auth.dto;

import com.ssafy.unblur.domain.auth.model.AuthProvider;
import com.ssafy.unblur.domain.auth.model.Gender;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignupDto {

    @NotBlank(message = "이메일은 필수 입력값입니다.")
    @Email(message = "유효한 이메일 형식이 아닙니다.")
    private String email;

    @NotBlank(message = "비밀번호는 필수 입력값입니다.")
    @Size(min = 9, max = 16, message = "비밀번호는 9자에서 16자 사이여야 합니다.")
    @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{9,16}$",
            message = "비밀번호는 영문, 숫자, 특수문자를 최소 하나씩 포함해야 합니다."
    )
    private String password;

    @NotBlank(message = "닉네임은 필수 입력값입니다.")
    @Size(max = 10, message = "닉네임은 최대 10자까지 가능합니다.")
    private String nickname;

    @NotNull(message = "생년월일은 필수 입력값입니다.")
    private LocalDate birthDate;

    @NotNull(message = "성별은 필수 입력값입니다.")
    private Gender gender;

    @Builder.Default
    private AuthProvider authProvider = AuthProvider.LOCAL;

}