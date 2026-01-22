package com.ssafy.unblur.domain.user.controller;

import com.ssafy.unblur.domain.user.dto.SignupDto;
import com.ssafy.unblur.domain.user.dto.SignupResponseDto;
import com.ssafy.unblur.domain.user.service.UserService;
import com.ssafy.unblur.common.response.BaseResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController implements AuthApiDocs {

    private final UserService userService;

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
}