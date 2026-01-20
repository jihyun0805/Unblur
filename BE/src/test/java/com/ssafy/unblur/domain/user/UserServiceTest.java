package com.ssafy.unblur.domain.user;

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
    void signUpSuccess() {
        // given: 이런 데이터가 주어졌을 때
        SignupDto dto = SignupDto.builder().email("test@ssafy.com").password("test1234!").nickname("테스트유저").build();

        // when: 회원가입을 실행하면
        userService.signUp(dto);

        // then: DB에 잘 저장되었는지 확인
        User savedUser = userRepository.findByEmail("test@ssafy.com").orElseThrow();
        Assertions.assertEquals("테스트유저", savedUser.getNickname());
    }

    @Test
    @DisplayName("이메일 중복 확인 요청")
    void isEmailDuplicateTest() {
        // given
        SignupDto dto1 = SignupDto.builder().email("EmailDup@ssafy.com").password("pw1!").nickname("user1").build();
        userService.signUp(dto1);

        // when
        boolean isDup = userService.isEmailDuplicate("EmailDup@ssafy.com");
        boolean isNotDup = userService.isEmailDuplicate("newEmail@ssafy.com");

        // then
        Assertions.assertTrue(isDup, "이미 가입된 이메일은 true를 반환해야 합니다.");
        Assertions.assertFalse(isNotDup, "새로운 이메일은 false를 반환해야 합니다.");
    }

    @Test
    @DisplayName("중복 이메일 가입 시 예외 발생")
    void duplicateEmailTest() {
        // given
        SignupDto dto1 = SignupDto.builder().email("same@ssafy.com").password("pw1!").nickname("user1").build();
        userService.signUp(dto1);

        // when
        SignupDto dto2 = SignupDto.builder().email("same@ssafy.com").password("pw2!").nickname("user2").build();

        // then
        IllegalArgumentException exception = Assertions.assertThrows(IllegalArgumentException.class, () -> {
            userService.signUp(dto2);
        });
        Assertions.assertEquals("이미 사용중인 이메일입니다.", exception.getMessage());
    }

    @Test
    @DisplayName("닉네임 중복 확인 요청")
    void isNicknameDuplicateTest() {
        // given
        SignupDto dto1 = SignupDto.builder().email("EmailDup@ssafy.com").password("pw1!").nickname("test").build();
        userService.signUp(dto1);

        // when
        boolean isDup = userService.isNicknameDuplicate("test");
        boolean isNotDup = userService.isNicknameDuplicate("test2");

        // then
        Assertions.assertTrue(isDup, "이미 존재하는 닉네임은 true를 반환해야 합니다.");
        Assertions.assertFalse(isNotDup, "새로운 닉네임은 false를 반환해야 합니다.");
    }

    @Test
    @DisplayName("중복 닉네임 가입 시 예외 발생")
    void duplicateNicknameTest() {
        // given
        SignupDto dto1 = SignupDto.builder().email("test1@ssafy.com").password("pw1!").nickname("kitty").build();
        userService.signUp(dto1);

        // when
        SignupDto dto2 = SignupDto.builder().email("test2@ssafy.com").password("pw2!").nickname("kitty").build();

        // then
        IllegalArgumentException exception = Assertions.assertThrows(IllegalArgumentException.class, () -> {
            userService.signUp(dto2);
        });
        Assertions.assertEquals("이미 사용중인 닉네임입니다.", exception.getMessage());
    }
}