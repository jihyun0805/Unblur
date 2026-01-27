package com.ssafy.unblur.domain.user.service;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.auth.service.AuthService;
import com.ssafy.unblur.domain.auth.service.RefreshTokenService;
import com.ssafy.unblur.domain.user.dto.UserProfileResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;

    /**
     * 회원 탈퇴를 진행합니다.
     */
    @Transactional
    public void withdraw(String email) {
        User user = authService.findUserByEmail(email)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        refreshTokenService.deleteTokenByUser(user);

        user.withdraw();
    }

    /**
     * 현재 로그인된 사용자의 프로필 정보를 조회합니다.
     */
    @Transactional(readOnly = true)
    public UserProfileResponseDto getMyProfile(String email) {
        User user = authService.findUserByEmail(email)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        return UserProfileResponseDto.from(user);
    }

}
