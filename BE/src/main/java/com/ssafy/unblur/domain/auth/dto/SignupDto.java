package com.ssafy.unblur.domain.auth.dto;

import com.ssafy.unblur.domain.auth.model.Gender;
import com.ssafy.unblur.domain.auth.model.Region;
import io.netty.channel.ChannelHandler;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignupDto {

    @NotBlank(message = "이메일은 필수 입력값입니다.")
    @Email(message = "유효한 이메일 형식이 아닙니다.")
    @Schema(description = "이메일", example = "ssafy@unblur.com")
    private String email;

    @NotBlank(message = "비밀번호는 필수 입력값입니다.")
    @Size(min = 9, max = 16, message = "비밀번호는 9자에서 16자 사이여야 합니다.")
    @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{9,16}$",
            message = "비밀번호는 영문, 숫자, 특수문자를 최소 하나씩 포함해야 합니다."
    )
    @Schema(description = "비밀번호 (영문, 숫자, 특수문자 포함 9~16자)", example = "unblur123!")
    private String password;

    @NotBlank(message = "닉네임은 필수 입력값입니다.")
    @Size(max = 10, message = "닉네임은 최대 10자까지 가능합니다.")
    @Schema(description = "닉네임 (최대 10자)", example = "언블러")
    private String nickname;

    @NotNull(message = "생년월일은 필수 입력값입니다.")
    @Schema(description = "생년월일", example = "2000-01-01")
    private LocalDate birthDate;

    @NotNull(message = "성별은 필수 입력값입니다.")
    @Schema(description = "성별 (MALE/FEMALE)", example = "MALE")
    private Gender gender;

    @Schema(description = "지역 정보", example = "SEOUL")
    private Region region;

    @Schema(description = "설문 응답 상세 데이터(JSON")
    private Map<String, Object> detailedInfo;

    @NotEmpty(message = "관심사를 최소 하나 이상 선택해주세요.")
    @Schema(description = "관심사 태그 목록", example = "[\"코딩\", \"만화\"]")
    private List<String> interestTags;
}