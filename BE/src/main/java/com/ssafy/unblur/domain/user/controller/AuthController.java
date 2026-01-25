package com.ssafy.unblur.domain.user.controller;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.common.security.jwt.JWTUtil;
import com.ssafy.unblur.domain.user.dto.LoginRequestDto;
import com.ssafy.unblur.domain.user.dto.LoginResponseDto;
import com.ssafy.unblur.domain.user.dto.SignupDto;
import com.ssafy.unblur.domain.user.dto.SignupResponseDto;
import com.ssafy.unblur.domain.user.dto.TokenReissueResultDto;
import com.ssafy.unblur.domain.user.model.User;
import com.ssafy.unblur.domain.user.repository.UserRepository;
import com.ssafy.unblur.domain.user.service.RefreshTokenService;
import com.ssafy.unblur.domain.user.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController implements AuthApiDocs {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final UserService userService;
    private final JWTUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;


    @Override
    @PostMapping("/register")
    public ResponseEntity<BaseResponse<SignupResponseDto>> signUp(@Valid @RequestBody SignupDto signUpDto) {
        String createdUserId = userService.signUp(signUpDto);
        SignupResponseDto responseDto = new SignupResponseDto(createdUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(BaseResponse.success(201, "회원가입이 완료되었습니다.", responseDto));
    }

    @Override
    @GetMapping("/check-email")
    public ResponseEntity<BaseResponse<Boolean>> checkEmail(@RequestParam String email) {
        return ResponseEntity.ok(
                BaseResponse.success(200, "OK", userService.isEmailDuplicate(email))
        );
    }

    @Override
    @GetMapping("/check-nickname")
    public ResponseEntity<BaseResponse<Boolean>> checkNickname(@RequestParam String nickname) {
        return ResponseEntity.ok(
                BaseResponse.success(200, "OK", userService.isNicknameDuplicate(nickname))
        );
    }

    @PostMapping("/login")
    public ResponseEntity<BaseResponse<Object>> login (
            @RequestBody LoginRequestDto loginRequest,
            HttpServletResponse response
    ) {

        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(BaseResponse.fail(401, "비밀번호가 일치하지 않습니다."));
        }

        // 계정 활성화 여부 체크
        if (!user.isActive()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(BaseResponse.fail(403, "비활성화된 계정입니다."));
        }

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
}
