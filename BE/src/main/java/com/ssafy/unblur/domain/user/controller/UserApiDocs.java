package com.ssafy.unblur.domain.user.controller;

import com.ssafy.unblur.common.response.BaseResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;

@Tag(name = "User", description = "사용자 정보 관리 관련 API(회원 탈퇴, 프로필 조회/수정 등)")
public interface UserApiDocs {

    @Operation(summary = "회원 탈퇴", description = "현재 로그인된 사용자의 계정을 탈퇴 처리합니다.")
    @ApiResponse(responseCode = "200", description = "회원 탈퇴 성공")
    @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자")
    @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음")
    ResponseEntity<BaseResponse<Void>> withdraw(HttpServletResponse response);
}
