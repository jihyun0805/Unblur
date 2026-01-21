package com.ssafy.unblur.domain.user;

import com.ssafy.unblur.global.BaseResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;

@Tag(name = "Auth", description = "인증 관련 API (회원가입, 중복 체크 등)")
public interface AuthApiDocs {

    /**
     * 새로운 사용자를 등록합니다.
     * @param signUpDto 회원가입에 필요한 정보(이메일, 비밀번호, 닉네임 등)
     * @return 성공 시 201 상태 코드와 함께 생성된 유저의 ID를 반환
     */
    @Operation(summary = "회원가입", description = "새로운 사용자를 등록합니다.")
    @ApiResponse(responseCode = "201", description = "회원가입 성공")
    ResponseEntity<BaseResponse<SignupResponseDto>> signUp(@RequestBody SignupDto signUpDto);

    /**
     * 이메일 중복 여부를 확인합니다.
     * @param email 중복 확인할 이메일 주소
     * @return 성공 시 200 상태 코드와 함께 중복 여부(true: 중복)를 반환
     */
    @Operation(summary = "이메일 중복 확인", description = "입력받은 이메일이 DB에 존재하는지 확인합니다.")
    @ApiResponse(responseCode = "200", description = "조회 성공 (true: 중복됨, false: 사용 가능)")
    ResponseEntity<BaseResponse<Boolean>> checkEmail(
            @Parameter(description = "이메일 주소", example = "test@ssafy.com")
            String email);

    /**
     * 닉네임 중복 여부를 확인합니다.
     * @param nickname 중복 확인할 사용자의 닉네임
     * @return 성공 시 200 상태 코드와 함께 중복 여부(true: 중복)를 반환
     */
    @Operation(summary = "닉네임 중복 확인", description = "닉네임 중복 여부를 체크합니다.")
    @ApiResponse(responseCode = "200", description = "조회 성공 (true: 중복됨, false: 사용 가능)")
    ResponseEntity<BaseResponse<Boolean>> checkNickname(
            @Parameter(description = "중복 확인할 닉네임", example = "unblur")
            String nickname);
}
