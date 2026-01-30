package com.ssafy.unblur.domain.user.controller.impl;

import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.domain.user.controller.UserApiDocs;
import com.ssafy.unblur.domain.user.dto.UserProfileResponseDto;
import com.ssafy.unblur.domain.user.dto.UserProfileUpdateRequestDto;
import com.ssafy.unblur.domain.user.dto.UserSurveyResponseDto;
import com.ssafy.unblur.domain.user.dto.UserSurveyUpdateRequestDto;
import com.ssafy.unblur.domain.user.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController implements UserApiDocs {

    private final UserService userService;

    @Override
    @DeleteMapping("/me")
    public ResponseEntity<BaseResponse<Void>> withdraw(HttpServletResponse response) {
        userService.withdraw();
        response.addCookie(clearRefreshTokenCookie());
        return ResponseEntity.ok(
                BaseResponse.onSuccess("회원 탈퇴 성공", null)
        );
    }

    @Override
    @GetMapping("/me")
    public ResponseEntity<BaseResponse<UserProfileResponseDto>> getMyProfile() {
        UserProfileResponseDto response = userService.getMyProfile();
        return ResponseEntity.ok(
                BaseResponse.onSuccess("프로필 조회 성공", response)
        );
    }

    @Override
    @PatchMapping("/me")
    public ResponseEntity<BaseResponse<UserProfileResponseDto>> updateMyProfile(@RequestBody UserProfileUpdateRequestDto dto) {
        UserProfileResponseDto updatedProfile = userService.updateMyProfile(dto);
        return ResponseEntity.ok(
                BaseResponse.onSuccess("프로필 수정 성공", updatedProfile)
        );
    }

    @Override
    @GetMapping("/me/survey")
    public ResponseEntity<BaseResponse<UserSurveyResponseDto>> getMySurvey() {
        UserSurveyResponseDto response = userService.getMySurvey();
        return ResponseEntity.ok(
                BaseResponse.onSuccess("설문조사 조회 성공", response)
        );
    }

    @Override
    @PatchMapping("/me/survey")
    public ResponseEntity<BaseResponse<UserSurveyResponseDto>> updateMySurvey(@RequestBody UserSurveyUpdateRequestDto dto) {
        UserSurveyResponseDto updatedSurvey = userService.updateMySurvey(dto);
        return ResponseEntity.ok(
                BaseResponse.onSuccess("설문조사 수정 성공", updatedSurvey)
        );
    }

    @Override
    @PostMapping("/{user_id}/block")
    public ResponseEntity<BaseResponse<Void>> blockUser(
            @PathVariable("user_id") UUID blockedId) {

        userService.blockUser(blockedId);
        return ResponseEntity.ok(
                BaseResponse.onSuccess("사용자를 차단했습니다.", null));
    }

    @Override
    @DeleteMapping("/{user_id}/block")
    public ResponseEntity<BaseResponse<Void>> unblockUser(
            @PathVariable("user_id") UUID blockedId) {

        userService.unblockUser(blockedId);
        return ResponseEntity.ok(
                BaseResponse.onSuccess("차단을 해제했습니다.", null));
    }

    private Cookie clearRefreshTokenCookie() {
        Cookie cookie = new Cookie("refresh_token", null);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        return cookie;
    }
}
