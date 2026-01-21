package com.ssafy.unblur.domain.user;

import com.ssafy.unblur.global.CustomException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@Transactional
@SpringBootTest
class UserServiceTest {

    @Autowired
    UserService userService;

    @Autowired
    UserRepository userRepository;

    @Test
    @DisplayName("회원가입 성공 테스트")
    void signUpTest() {
        // given: 회원가입 데이터가 주어졌을 때
        String rawPassword = "test1234!";
        SignupDto dto = new SignupDto("signup@ssafy.com", rawPassword, "테스트유저");

        // when: 회원가입을 실행하면
        userService.signUp(dto);

        // then: DB에 잘 저장되었는지 확인하고 비밀번호 암호화 여부 확인
        User savedUser = userRepository.findByEmail("signup@ssafy.com").orElseThrow();
        Assertions.assertEquals("테스트유저", savedUser.getNickname());
        Assertions.assertNotEquals(rawPassword, savedUser.getPassword());
    }

    @Test
    @DisplayName("이메일 중복 확인 요청")
    void isEmailDuplicateTest() {
        // given: 중복된 이메일의 사용자가 존재할 때
        SignupDto dto = new SignupDto("EmailDup@ssafy.com", "pw1!", "user1");
        userService.signUp(dto);

        // when: 사용하려는 이메일이 DB에 있는지 확인한다면
        boolean isDuplicated = userService.isEmailDuplicate("EmailDup@ssafy.com");
        boolean isNotDuplicated = userService.isEmailDuplicate("newEmail@ssafy.com");

        // then: DB에 있으면 True, 없으면 False를 반환한다
        Assertions.assertTrue(isDuplicated, "이미 가입된 이메일은 true를 반환해야 합니다.");
        Assertions.assertFalse(isNotDuplicated, "새로운 이메일은 false를 반환해야 합니다.");
    }

    @Test
    @DisplayName("중복 이메일 가입 시 예외 발생")
    void duplicateEmailTest() {
        // given: 중복된 이메일의 사용자가 존재할 때
        SignupDto dto1 = new SignupDto("same@ssafy.com", "pw1!", "user2");
        userService.signUp(dto1);

        // when: 중복된 이메일을 사용하여 회원가입을 시도한다면
        SignupDto dto2 = new SignupDto("same@ssafy.com", "pw1!", "user3");

        // then: DuplicateEmailException 예외가 발생한다
        Assertions.assertThrows(CustomException.DuplicateEmailException.class, () -> {
            userService.signUp(dto2);
        });
    }

    @Test
    @DisplayName("닉네임 중복 확인 요청")
    void isNicknameDuplicateTest() {
        // given: 중복된 닉네임의 사용자가 존재할 때
        SignupDto dto = new SignupDto("nicktest@ssafy.com", "pw1!", "test");
        userService.signUp(dto);

        // when: 사용하려는 닉네임이 DB에 있는지 확인한다면
        boolean isDuplicated = userService.isNicknameDuplicate("test");
        boolean isNotDuplicated = userService.isNicknameDuplicate("test2");

        // then: DB에 있으면 True, 없으면 False를 반환한다
        Assertions.assertTrue(isDuplicated, "이미 존재하는 닉네임은 true를 반환해야 합니다.");
        Assertions.assertFalse(isNotDuplicated, "새로운 닉네임은 false를 반환해야 합니다.");
    }

    @Test
    @DisplayName("중복 닉네임 가입 시 예외 발생")
    void duplicateNicknameTest() {
        // given: 중복된 닉네임의 사용자가 존재할 때
        SignupDto dto1 = new SignupDto("test1@ssafy.com", "pw1!", "kitty");
        userService.signUp(dto1);

        // when: 중복된 닉네임을 사용하여 회원가입을 시도한다면
        SignupDto dto2 = new SignupDto("test2@ssafy.com", "pw1!", "kitty");

        // then: DuplicateNicknameException 예외가 발생한다
        Assertions.assertThrows(CustomException.DuplicateNicknameException.class, () -> {
            userService.signUp(dto2);
        });
    }
}