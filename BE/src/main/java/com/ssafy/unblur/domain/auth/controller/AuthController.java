package com.ssafy.unblur.domain.auth.controller;

import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.common.security.jwt.JWTUtil;
import com.ssafy.unblur.common.util.SecurityUtil;
import com.ssafy.unblur.domain.auth.dto.*;
import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.auth.service.AuthService;
import com.ssafy.unblur.domain.auth.service.RefreshTokenService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController implements AuthApiDocs {

    private final AuthService authService;
    private final JWTUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;


    @Override
    @PostMapping("/register")
    public ResponseEntity<BaseResponse<SignupResponseDto>> signUp(@Valid @RequestBody SignupDto signUpDto) {
        String createdUserId = authService.signUp(signUpDto);
        SignupResponseDto responseDto = new SignupResponseDto(createdUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(BaseResponse.success(201, "회원가입이 완료되었습니다.", responseDto));
    }

    @Override
    @GetMapping("/check-email")
    public ResponseEntity<BaseResponse<Boolean>> checkEmail(@RequestParam String email) {
        return ResponseEntity.ok(
                BaseResponse.success(200, "OK", authService.isEmailDuplicate(email))
        );
    }

    @Override
    @GetMapping("/check-nickname")
    public ResponseEntity<BaseResponse<Boolean>> checkNickname(@RequestParam String nickname) {
        return ResponseEntity.ok(
                BaseResponse.success(200, "OK", authService.isNicknameDuplicate(nickname))
        );
    }

    @PostMapping("/login")
    public ResponseEntity<BaseResponse<LoginResponseDto>> login(
            @RequestBody LoginRequestDto loginRequest,
            HttpServletResponse response
    ) {

        User user = authService.login(loginRequest);

        String accessToken = jwtUtil.createAccessToken(user.getEmail());
        String refreshToken = jwtUtil.createRefreshToken(user.getEmail());

        refreshTokenService.saveRefreshToken(user, refreshToken, jwtUtil.getJti(refreshToken),
                jwtUtil.getExpiration(refreshToken).toInstant());

        response.addHeader("Authorization", "Bearer " + accessToken);
        response.addCookie(createRefreshTokenCookie(refreshToken));

        LoginResponseDto loginResponse = new LoginResponseDto(accessToken);

        return ResponseEntity.ok(
                BaseResponse.success(200, "OK", loginResponse)
        );
    }

    @PostMapping("/reissue")
    public ResponseEntity<BaseResponse<LoginResponseDto>> reissue(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String refreshToken = extractRefreshTokenFromCookie(request);
        TokenReissueResultDto result = refreshTokenService.reissue(refreshToken);

        response.addHeader("Authorization", "Bearer " + result.getAccessToken());
        response.addCookie(createRefreshTokenCookie(result.getRefreshToken()));

        return ResponseEntity.ok(
                BaseResponse.success(200, "토큰 재발행 성공", new LoginResponseDto(result.getAccessToken()))
        );
    }

    @PostMapping("/logout")
    public ResponseEntity<BaseResponse<Void>> logout(HttpServletResponse response) {
        SecurityUtil.getCurrentUserEmail().ifPresent(email -> {
            authService.findUserByEmail(email).ifPresent(user -> {
                refreshTokenService.deleteTokenByUser(user);
            });
        });

        response.addCookie(clearRefreshTokenCookie());

        return ResponseEntity.ok(
                BaseResponse.success(200, "로그아웃 성공", null)
        );
    }

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if ("refresh_token".equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private Cookie createRefreshTokenCookie(String refreshToken) {
        Cookie cookie = new Cookie("refresh_token", refreshToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(14 * 24 * 60 * 60);
        return cookie;
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
