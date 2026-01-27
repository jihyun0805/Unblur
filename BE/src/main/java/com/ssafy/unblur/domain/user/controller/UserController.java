package com.ssafy.unblur.domain.user.controller;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.common.util.SecurityUtil;
import com.ssafy.unblur.domain.user.dto.UserProfileResponseDto;
import com.ssafy.unblur.domain.user.dto.UserProfileUpdateRequestDto;
import com.ssafy.unblur.domain.user.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController implements UserApiDocs {

    private final UserService userService;

    @Override
    @DeleteMapping("/me")
    public ResponseEntity<BaseResponse<Void>> withdraw(HttpServletResponse response) {
        String currentUserEmail = SecurityUtil.getCurrentUserEmail()
                .orElseThrow(() -> new BaseException(ErrorCode.UNAUTHORIZED));

        userService.withdraw(currentUserEmail);

        response.addCookie(clearRefreshTokenCookie());

        return ResponseEntity.ok(
                BaseResponse.onSuccess("회원 탈퇴가 성공적으로 처리되었습니다.", null)
        );
    }

    @Override
    @GetMapping("/me")
    public ResponseEntity<BaseResponse<UserProfileResponseDto>> getMyProfile() {
        String email = SecurityUtil.getCurrentUserEmail()
                .orElseThrow(() -> new BaseException(ErrorCode.UNAUTHORIZED));

        UserProfileResponseDto response = userService.getMyProfile(email);

        return ResponseEntity.ok(
                BaseResponse.onSuccess("내 정보 조회가 성공적으로 처리되었습니다.", response)
        );
    }

    @Override
    @PatchMapping("/me")
    public ResponseEntity<BaseResponse<UserProfileResponseDto>> updateMyProfile(@RequestBody UserProfileUpdateRequestDto dto) {
        String email = SecurityUtil.getCurrentUserEmail()
                .orElseThrow(() -> new BaseException(ErrorCode.UNAUTHORIZED));

        UserProfileResponseDto updatedProfile = userService.updateMyProfile(email, dto);

        return ResponseEntity.ok(
                BaseResponse.onSuccess("내 정보 수정이 성공적으로 처리되었습니다.", updatedProfile)
        );
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
