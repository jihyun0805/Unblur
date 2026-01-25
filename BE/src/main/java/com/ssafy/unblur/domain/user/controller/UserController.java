package com.ssafy.unblur.domain.user.controller;

import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.common.util.SecurityUtil;
import com.ssafy.unblur.domain.user.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @DeleteMapping("/me")
    public ResponseEntity<BaseResponse<Void>> withdraw(HttpServletResponse response) {
        String currentUserEmail = SecurityUtil.getCurrentUserEmail()
                .orElseThrow(() -> new RuntimeException("인증된 사용자 정보를 찾을 수 없습니다."));

        userService.withdraw(currentUserEmail);

        response.addCookie(clearRefreshTokenCookie());

        return ResponseEntity.ok(
                BaseResponse.success(200, "회원 탈퇴가 성공적으로 처리되었습니다.", null)
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
