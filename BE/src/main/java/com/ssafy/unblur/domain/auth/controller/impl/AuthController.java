package com.ssafy.unblur.domain.auth.controller.impl;

import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.common.security.jwt.JWTUtil;
import com.ssafy.unblur.common.service.SseService;
import com.ssafy.unblur.common.util.SecurityUtil;
import com.ssafy.unblur.domain.auth.controller.AuthApiDocs;
import com.ssafy.unblur.domain.auth.dto.request.LoginRequestDto;
import com.ssafy.unblur.domain.auth.dto.request.EmailVerificationConfirmRequestDto;
import com.ssafy.unblur.domain.auth.dto.request.EmailVerificationRequestDto;
import com.ssafy.unblur.domain.auth.dto.request.PasswordResetRequestDto;
import com.ssafy.unblur.domain.auth.dto.request.SignupRequestDto;
import com.ssafy.unblur.domain.auth.dto.response.LoginResponseDto;
import com.ssafy.unblur.domain.auth.dto.response.SignupResponseDto;
import com.ssafy.unblur.domain.auth.dto.response.TokenReissueResponseDto;
import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.auth.service.AuthService;
import com.ssafy.unblur.domain.auth.service.EmailVerificationService;
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
    private final SseService sseService;
    private final EmailVerificationService emailVerificationService;


    @Override
    @PostMapping("/register")
    public ResponseEntity<BaseResponse<SignupResponseDto>> signUp(@Valid @RequestBody SignupRequestDto signupRequestDto) {
        String createdUserId = authService.signUp(signupRequestDto);
        SignupResponseDto responseDto = new SignupResponseDto(createdUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(
                        BaseResponse.onCreate("회원가입이 완료되었습니다.", responseDto)
                );
    }

    @Override
    @GetMapping("/check-email")
    public ResponseEntity<BaseResponse<Boolean>> checkEmail(@RequestParam String email) {
        boolean isDuplicate = authService.isEmailDuplicate(email);
        return ResponseEntity.ok(
                BaseResponse.onSuccess("이메일 중복 확인에 성공했습니다.", isDuplicate)
        );
    }

    @Override
    @GetMapping("/check-nickname")
    public ResponseEntity<BaseResponse<Boolean>> checkNickname(@RequestParam String nickname) {
        boolean nicknameDuplicate = authService.isNicknameDuplicate(nickname);

        return ResponseEntity.ok(
                BaseResponse.onSuccess("닉네임 중복 확인에 성공했습니다.", nicknameDuplicate)
        );
    }

    @PostMapping("/login")
    public ResponseEntity<BaseResponse<LoginResponseDto>> login(
            @RequestBody LoginRequestDto loginRequest,
            HttpServletResponse response
    ) {

        User user = authService.login(loginRequest);

        String accessToken = jwtUtil.createAccessToken(user.getId(), user.getEmail());
        String refreshToken = jwtUtil.createRefreshToken(user.getId(), user.getEmail());

        refreshTokenService.saveRefreshToken(user, refreshToken, jwtUtil.getJti(refreshToken),
                jwtUtil.getExpiration(refreshToken).toInstant());

        response.addHeader("Authorization", "Bearer " + accessToken);
        response.addCookie(createRefreshTokenCookie(refreshToken));

        LoginResponseDto loginResponse = new LoginResponseDto(accessToken);

        return ResponseEntity.ok(
                BaseResponse.onSuccess("로그인에 성공했습니다.", loginResponse)
        );
    }

    @PostMapping("/reissue")
    public ResponseEntity<BaseResponse<LoginResponseDto>> reissue(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String refreshToken = extractRefreshTokenFromCookie(request);
        TokenReissueResponseDto result = refreshTokenService.reissue(refreshToken);

        response.addHeader("Authorization", "Bearer " + result.accessToken());
        response.addCookie(createRefreshTokenCookie(result.refreshToken()));

        return ResponseEntity.ok(
                BaseResponse.onSuccess("토큰 재발행에 성공했습니다.", new LoginResponseDto(result.accessToken()))
        );
    }

    @PostMapping("/logout")
    public ResponseEntity<BaseResponse<Void>> logout(HttpServletResponse response) {
        SecurityUtil.getCurrentUserEmail().ifPresent(email -> {
            authService.findUserByEmail(email).ifPresent(user -> {
                refreshTokenService.deleteTokenByUser(user);
                sseService.disconnect(user.getId());
            });
        });

        response.addCookie(clearRefreshTokenCookie());

        return ResponseEntity.ok(
                BaseResponse.onSuccess("로그아웃에 성공하였습니다.", null)
        );
    }

    @Override
    @PostMapping("/password/reset/code")
    public ResponseEntity<BaseResponse<Void>> sendPasswordResetCode(
            @Valid @RequestBody EmailVerificationRequestDto request
    ) {
        emailVerificationService.sendPasswordResetCode(request.email());
        return ResponseEntity.ok(BaseResponse.onSuccess("인증 코드를 전송했습니다.", null));
    }

    @Override
    @PostMapping("/password/reset/confirm")
    public ResponseEntity<BaseResponse<Void>> confirmPasswordResetCode(
            @Valid @RequestBody EmailVerificationConfirmRequestDto request
    ) {
        emailVerificationService.confirmPasswordResetCode(request.email(), request.code());
        return ResponseEntity.ok(BaseResponse.onSuccess("인증 코드 확인에 성공했습니다.", null));
    }

    @Override
    @PostMapping("/password/reset")
    public ResponseEntity<BaseResponse<Void>> resetPassword(
            @Valid @RequestBody PasswordResetRequestDto request
    ) {
        emailVerificationService.resetPassword(request.email(), request.code(), request.newPassword());
        return ResponseEntity.ok(BaseResponse.onSuccess("비밀번호가 변경되었습니다.", null));
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
