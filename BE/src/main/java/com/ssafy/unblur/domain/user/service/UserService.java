package com.ssafy.unblur.domain.user.service;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.common.util.SecurityUtil;
import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.auth.model.UserBlock;
import com.ssafy.unblur.domain.auth.repository.UserRepository;
import com.ssafy.unblur.domain.auth.service.AuthService;
import com.ssafy.unblur.domain.auth.service.RefreshTokenService;
import com.ssafy.unblur.domain.user.dto.LoveDnaUpdateRequest;
import com.ssafy.unblur.domain.user.dto.request.UserProfileUpdateRequestDto;
import com.ssafy.unblur.domain.user.dto.request.UserSurveyUpdateRequestDto;
import com.ssafy.unblur.domain.user.dto.response.UserProfileResponseDto;
import com.ssafy.unblur.domain.user.dto.response.UserSurveyResponseDto;
import com.ssafy.unblur.domain.user.repository.UserBlockRepository;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final UserBlockRepository userBlockRepository;
    private final UserRepository userRepository;

    /**
     * 회원 탈퇴를 진행합니다.
     */
    @Transactional
    public void withdraw() {
        User user = getLoginUserAndCheckActive();

        refreshTokenService.deleteTokenByUser(user);

        user.withdraw();
    }

    /**
     * 현재 로그인된 사용자의 프로필 정보를 조회합니다.
     */
    @Transactional(readOnly = true)
    public UserProfileResponseDto getMyProfile() {
        User user = getLoginUserAndCheckActive();

        return UserProfileResponseDto.from(user);
    }

    /**
     * 현재 로그인된 사용자의 프로필 정보를 수정합니다.
     */
    @Transactional
    public UserProfileResponseDto updateMyProfile(UserProfileUpdateRequestDto dto) {
        User user = getLoginUserAndCheckActive();

        String newNickname = dto.nickname();
        if (newNickname != null && !newNickname.isBlank()
                && !newNickname.equals(user.getNickname())
                && userRepository.existsByNickname(newNickname)) {
            throw new BaseException(ErrorCode.DUPLICATE_NICKNAME);
        }

        user.updateProfile(dto);

        return UserProfileResponseDto.from(user);
    }

    /**
     * 현재 로그인된 사용자의 설문조사 정보를 조회합니다.
     */
    @Transactional(readOnly = true)
    public UserSurveyResponseDto getMySurvey() {
        User user = getLoginUserAndCheckActive();

        return UserSurveyResponseDto.from(user);
    }

    /**
     * 현재 로그인된 사용자의 설문조사 정보를 수정합니다.
     */
    @Transactional
    public UserSurveyResponseDto updateMySurvey(UserSurveyUpdateRequestDto dto) {
        User user = getLoginUserAndCheckActive();

        user.updateSurvey(dto);

        return UserSurveyResponseDto.from(user);
    }

    /**
     * 사용자의 연애 성향 유형 정보를 수정하는 메서드
     */
    @Transactional
    public UserProfileResponseDto updateLoveDna(LoveDnaUpdateRequest dto) {
        User user = getLoginUserAndCheckActive();

        user.updateLoveDna(dto.getLoveDna());

        return UserProfileResponseDto.from(user);
    }

    /**
     * 특정 사용자를 차단합니다.
     */
    @Transactional
    public void blockUser(UUID blockedId) {
        User blocker = getLoginUserAndCheckActive();

        User blocked = userRepository.findById(blockedId)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        if (blocker.getId().equals(blockedId)) {
            throw new BaseException(ErrorCode.CANNOT_BLOCK_SELF);
        }

        if (userBlockRepository.existsByBlockerAndBlocked(blocker, blocked)) {
            throw new BaseException(ErrorCode.ALREADY_BLOCKED);
        }

        UserBlock userBlock = UserBlock.builder()
                .blocker(blocker)
                .blocked(blocked)
                .build();

        userBlockRepository.save(userBlock);
    }

    @Transactional
    public void unblockUser(UUID blockedId) {
        User blocker = getLoginUserAndCheckActive();

        User blocked = userRepository.findById(blockedId)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        // 차단 여부 확인(차단되지 않은 유저를 해제하려 하면 에러)
        if (!userBlockRepository.existsByBlockerAndBlocked(blocker, blocked)) {
            throw new BaseException(ErrorCode.NOT_BLOCKED_USER);
        }

        userBlockRepository.deleteByBlockerAndBlocked(blocker, blocked);
    }

    private @NonNull User getLoginUserAndCheckActive() {
        String email = SecurityUtil.getCurrentUserEmail()
                .orElseThrow(() -> new BaseException(ErrorCode.UNAUTHORIZED));
        User user = authService.findUserByEmail(email)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        if (!user.isActive()) {
            throw new BaseException(ErrorCode.INACTIVE_USER);
        }
        return user;
    }
}
