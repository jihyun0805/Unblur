package com.ssafy.unblur.domain.auth.dto.request;

import com.ssafy.unblur.domain.auth.model.Gender;
import com.ssafy.unblur.domain.auth.model.Mbti;
import com.ssafy.unblur.domain.auth.model.Region;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Builder
public record SignupRequestDto(
        @NotBlank(message = "이메일은 필수 입력값입니다.")
        @Email(message = "유효한 이메일 형식이 아닙니다.")
        @Schema(description = "이메일", example = "ssafy@unblur.com")
        String email,

        @NotBlank(message = "비밀번호는 필수 입력값입니다.")
        @Size(min = 9, max = 16, message = "비밀번호는 9자 이상 16자 이하여야 합니다.")
        @Pattern(
                regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{9,16}$",
                message = "비밀번호는 영문, 숫자, 특수문자를 최소 하나 이상 포함해야 합니다."
        )
        @Schema(description = "비밀번호(영문, 숫자, 특수문자 포함 9~16자)", example = "unblur123!")
        String password,

        @NotBlank(message = "닉네임은 필수 입력값입니다.")
        @Size(max = 10, message = "닉네임은 최대 10자까지 가능합니다.")
        @Pattern(regexp = "^[A-Za-z0-9가-힣]{1,10}$", message = "닉네임은 한글/영문/숫자만 사용할 수 있습니다.")
        @Schema(description = "닉네임(최대 10자, 한글/영문/숫자만)", example = "호랑이")
        String nickname,

        @NotNull(message = "생년월일은 필수 입력값입니다.")
        @Schema(description = "생년월일", example = "2000-01-01")
        LocalDate birthDate,

        @NotNull(message = "성별은 필수 입력값입니다.")
        @Schema(description = "성별 (MALE/FEMALE)", example = "MALE")
        Gender gender,

        @Schema(description = "지역 정보", example = "SEOUL")
        Region region,

        @Schema(description = "질문 상세 답변(JSON 형식)", example = "[{\"Answer\": \"active\", \"QuestionId\": \"dateStyle\"},\n" +
                "{\"Answer\": \"voice\", \"QuestionId\": \"contactStyle\"},\n" +
                "{\"Answer\": \"thoughtful\", \"QuestionId\": \"conflictStyle\"},\n" +
                "{\"Answer\": \"saver\", \"QuestionId\": \"spending\"},\n" +
                "{\"Answer\": \"career\", \"QuestionId\": \"priority\"},\n" +
                "{\"Answer\": [\"any\"], \"QuestionId\": \"agePreference\"},\n" +
                "{\"Answer\": \"any\", \"QuestionId\": \"distancePreference\"},\n" +
                "{\"Answer\": \"smoker\", \"QuestionId\": \"smokingSelf\"},\n" +
                "{\"Answer\": \"nonsmoker\", \"QuestionId\": \"smokingPartner\"},\n" +
                "{\"Answer\": \"heavy\", \"QuestionId\": \"drinkingSelf\"},\n" +
                "{\"Answer\": \"light\", \"QuestionId\": \"drinkingPartner\"},\n" +
                "{\"Answer\": \"buddhist\", \"QuestionId\": \"religionSelf\"},\n" +
                "{\"Answer\": \"no-pressure\", \"QuestionId\": \"religionPartner\"},\n" +
                "{\"Answer\": \"allergy\", \"QuestionId\": \"petSelf\"},\n" +
                "{\"Answer\": \"prefer-none\", \"QuestionId\": \"petPartner\"}]")
        List<Map<String, Object>> detailedInfo,

        @NotEmpty(message = "관심사를 최소 하나 이상 선택해주세요.")
        @Schema(description = "관심사 태그 목록", example = "[\"코딩\", \"영화\"]")
        List<String> interestTags,

        @Schema(description = "MBTI 유형", example = "ENFJ")
        Mbti mbti,

        @Schema(description = "한 줄 자기소개(자기소개)", example = "반갑습니다.", nullable = true)
        String intro
) {
}
