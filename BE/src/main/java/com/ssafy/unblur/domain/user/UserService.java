package com.ssafy.unblur.domain.user;

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

    // 회원가입
    @Transactional
    public void signUp(SignupDto signUpDto) {
        validateDuplicateEmail(signUpDto.getEmail());
        validateDuplicateNickname(signUpDto.getNickname()); // 닉네임 중복 검사 추가

        User user = createUserEntity(signUpDto);
        userRepository.save(user);
    }

    // 이메일 중복 검사
    private void validateDuplicateEmail(String email) {
        if (userRepository.existsByEmail(email)) {
            log.warn("중복된 이메일 입니다: {}", email);
            throw new IllegalArgumentException("이미 사용중인 이메일입니다.");
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
            throw new IllegalArgumentException("이미 사용중인 닉네임입니다.");
        }
    }

    // 단독 API용: 닉네임 존재 여부만 반환
    @Transactional(readOnly = true)
    public boolean isNicknameDuplicate(String nickname) {
        return userRepository.existsByNickname(nickname);
    }

    // 엔티티 생성
    private User createUserEntity(SignupDto signUpDto) {
        return User.builder().email(signUpDto.getEmail()).password(bCryptPasswordEncoder.encode(signUpDto.getPassword())) // 비밀번호 암호화
                .role(UserRole.USER) // 기본 권한 부여 (추후 변경 가능)
                .nickname(signUpDto.getNickname()).build();
    }
}