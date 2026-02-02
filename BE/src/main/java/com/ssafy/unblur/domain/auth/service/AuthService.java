package com.ssafy.unblur.domain.auth.service;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.domain.auth.dto.request.LoginRequestDto;
import com.ssafy.unblur.domain.auth.dto.request.SignupRequestDto;
import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;

    /**
     * 회원가입 프로세스를 진행합니다.
     * <p>이메일과 닉네임의 중복 여부를 최종적으로 확인한 후.
     * 비밀번호를 암호화하여 데이터베이스에 유저 정보를 저장합니다.</p>
     */
    @Transactional
    public String signUp(SignupRequestDto signupRequestDto) {
        validateDuplicateEmail(signupRequestDto.email());
        validateDuplicateNickname(signupRequestDto.nickname());

        String encodedPassword = bCryptPasswordEncoder.encode(signupRequestDto.password());
        User user = User.from(signupRequestDto, encodedPassword);

        User savedUser = userRepository.save(user);
        return savedUser.getEmail();
    }

    /**
     * 로그인 프로세스를 진행합니다.
     * <p> 사용자 이메일을 기반으로 유저를 조회하고, 비밀번호를 검증합니다.
     * 또한, 유저의 계정 활성화 상태를 확인합니다.</p>
     *
     * @param loginRequestDto 로그인 요청 DTO
     * @return 인증된 User 객체
     */
    @Transactional
    public User login(LoginRequestDto loginRequestDto) {
        User user = userRepository.findByEmail(loginRequestDto.email())
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        if (!bCryptPasswordEncoder.matches(loginRequestDto.password(), user.getPassword())) {
            throw new BaseException(ErrorCode.INVALID_CREDENTIALS);
        }

        if (!user.isActive()) {
            throw new BaseException(ErrorCode.INACTIVE_USER);
        }

        return user;
    }

    /**
     * '회원가입 버튼'을 눌렀을 때 실행됩니다.
     * 이 때 중복이 발견되면 프로세스를 즉시 중단시키고 {@link ErrorCode#DUPLICATE_EMAIL} 예외를 던집니다.
     */
    private void validateDuplicateEmail(String email) {
        if (email == null || !email.matches("^[A-za-z0-9+_.-]+@(.+)$")) {
            throw new BaseException(ErrorCode.INVALID_EMAIL_FORMAT);
        }

        if (userRepository.existsByEmail(email)) {
            log.warn("중복된 이메일 입니다: {}", email);
            throw new BaseException(ErrorCode.DUPLICATE_EMAIL);
        }
    }

    /**
     * 단순 이메일 중복 여부 조회를 위한 단독 API용 메서드입니다.
     */
    @Transactional(readOnly = true)
    public boolean isEmailDuplicate(String email) {
        return userRepository.existsByEmail(email);
    }

    /**
     * '회원가입 버튼'을 눌렀을 때 실행됩니다.
     * 이 때 중복이 발견되면 프로세스를 즉시 중단시키고 {@link ErrorCode#DUPLICATE_NICKNAME} 예외를 던집니다.
     */
    private void validateDuplicateNickname(String nickname) {
        if (userRepository.existsByNickname(nickname)) {
            log.warn("중복된 닉네임 입니다: {}", nickname);
            throw new BaseException(ErrorCode.DUPLICATE_NICKNAME);
        }
    }

    /**
     * 단순 닉네임 중복 여부 조회를 위한 단독 API용 메서드입니다.
     */
    @Transactional(readOnly = true)
    public boolean isNicknameDuplicate(String nickname) {
        return userRepository.existsByNickname(nickname);
    }


    /**
     * 이메일로 사용자를 조회하여 Optional로 반환합니다.
     */
    @Transactional(readOnly = true)
    public Optional<User> findUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}