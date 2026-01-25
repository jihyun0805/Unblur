package com.ssafy.unblur.domain.user.service;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.domain.user.dto.SignupDto;
import com.ssafy.unblur.domain.user.model.User;
import com.ssafy.unblur.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;

    /**
     * 회원가입 프로세스를 진행합니다.
     * <p>이메일과 닉네임의 중복 여부를 최종적으로 확인한 후.
     * 비밀번호를 암호화하여 데이터베이스에 유저 정보를 저장합니다.</p>
     */
    @Transactional
    public String signUp(SignupDto signUpDto) {
        validateDuplicateEmail(signUpDto.getEmail());
        validateDuplicateNickname(signUpDto.getNickname());

        String encodedPassword = bCryptPasswordEncoder.encode(signUpDto.getPassword());
        User user = User.from(signUpDto, encodedPassword);

        User savedUser = userRepository.save(user);
        return savedUser.getEmail();
    }

    /**
     * '회원가입 버튼'을 눌렀을 때 실행됩니다.
     * 이 때 중복이 발견되면 프로세스를 즉시 중단시키고 {@link ErrorCode#DUPLICATE_EMAIL} 예외를 던집니다.
     */
    private void validateDuplicateEmail(String email) {
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
}