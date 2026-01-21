package com.ssafy.unblur.domain.user;

import com.ssafy.unblur.global.CustomException;
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
     *
     * @param signUpDto 회원가입 정보 객체
     * @throws com.ssafy.unblur.global.CustomException.DuplicateEmailException    이메일 중복 시 발생
     * @throws com.ssafy.unblur.global.CustomException.DuplicateNicknameException 닉네임 중복 시 발생
     */
    @Transactional
    public String signUp(SignupDto signUpDto) {
        validateDuplicateEmail(signUpDto.getEmail());
        validateDuplicateNickname(signUpDto.getNickname()); // 닉네임 중복 검사 추가

        User user = User.from(signUpDto, bCryptPasswordEncoder.encode(signUpDto.getPassword()));
        User savedUser = userRepository.save(user);
        return savedUser.getEmail();
    }

    // 이메일 중복 검사
    private void validateDuplicateEmail(String email) {
        if (userRepository.existsByEmail(email)) {
            log.warn("중복된 이메일 입니다: {}", email);
            throw new CustomException.DuplicateEmailException();
        }
    }

    // 단독 API용: 단순히 존재 여부만 반환
    @Transactional(readOnly = true)
    public boolean isEmailDuplicate(String email) {
        return userRepository.existsByEmail(email);
    }

    // 닉네임 중복 검사
    private void validateDuplicateNickname(String nickname) {
        if (userRepository.existsByNickname(nickname)) {
            log.warn("중복된 닉네임 입니다: {}", nickname);
            throw new CustomException.DuplicateNicknameException();
        }
    }

    // 단독 API용: 닉네임 존재 여부만 반환
    @Transactional(readOnly = true)
    public boolean isNicknameDuplicate(String nickname) {
        return userRepository.existsByNickname(nickname);
    }
}