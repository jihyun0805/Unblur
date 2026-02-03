package com.ssafy.unblur.domain.auth;


import com.ssafy.unblur.domain.auth.dto.request.SignupRequestDto;
import com.ssafy.unblur.domain.auth.model.Gender;
import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.auth.repository.UserRepository;
import com.ssafy.unblur.domain.auth.service.AuthService;
import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;

@Testcontainers
@Transactional
@SpringBootTest
class AuthServiceTest {

    @Container
    @SuppressWarnings("resource")
    static PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("pgvector/pgvector:pg16")
                    .withDatabaseName("testdb")
                    .withUsername("test")
                    .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        postgres.start();
        try (var conn = postgres.createConnection("")) {
            conn.createStatement().execute("CREATE EXTENSION IF NOT EXISTS vector;");
        } catch (Exception e) {
            throw new RuntimeException("Failed to create vector extension", e);
        }
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    AuthService authService;

    @Autowired
    UserRepository userRepository;

    private SignupRequestDto createSignupDto(String email, String password, String nickname) {
        return SignupRequestDto.builder()
                .email(email)
                .password(password)
                .nickname(nickname)
                .birthDate(LocalDate.of(1995, 5, 15))
                .gender(Gender.MALE)
                .build();
    }

    @Test
    @DisplayName("회원가입 성공 테스트")
    void signUpTest() {
        // given: 회원가입 데이터가 주어졌을 때
        String rawPassword = "test1234!";
        SignupRequestDto dto = createSignupDto("signup@ssafy.com", rawPassword, "테스트유저");

        // when: 회원가입을 실행하면
        authService.signUp(dto);

        // then: DB에 잘 저장되었는지 확인하고 비밀번호 암호화 여부를 확인한다
        User savedUser = userRepository.findByEmail("signup@ssafy.com").orElseThrow();
        Assertions.assertEquals("테스트유저", savedUser.getNickname());
        Assertions.assertNotEquals(rawPassword, savedUser.getPassword());
    }

    @Test
    @DisplayName("이메일 중복 확인 요청")
    void isEmailDuplicateTest() {
        // given: 중복된 이메일의 사용자가 존재할 때
        SignupRequestDto dto = createSignupDto("EmailDup@ssafy.com", "test1234!", "user1");
        authService.signUp(dto);

        // when: 사용하려는 이메일이 DB에 있는지 확인한다면
        boolean isDuplicated = authService.isEmailDuplicate("EmailDup@ssafy.com");
        boolean isNotDuplicated = authService.isEmailDuplicate("newEmail@ssafy.com");

        // then: DB에 있으면 True, 없으면 False를 반환한다
        Assertions.assertTrue(isDuplicated, "이미 가입된 이메일은 true를 반환해야 합니다.");
        Assertions.assertFalse(isNotDuplicated, "새로운 이메일은 false를 반환해야 합니다.");
    }

    @Test
    @DisplayName("중복 이메일 가입 시 예외 발생")
    void duplicateEmailTest() {
        // given: 중복된 이메일의 사용자가 존재할 때
        SignupRequestDto dto1 = createSignupDto("same@ssafy.com", "test1234!", "user2");
        authService.signUp(dto1);

        // when: 중복된 이메일을 사용하여 회원가입을 시도한다면
        SignupRequestDto dto2 = createSignupDto("same@ssafy.com", "test1234!", "user3");

        // then: DuplicateEmailException 예외가 발생한다
        BaseException ex = Assertions.assertThrows(BaseException.class, () -> {
            authService.signUp(dto2);
        });
        Assertions.assertEquals(ErrorCode.DUPLICATE_EMAIL, ex.getErrorCode());
    }

    @Test
    @DisplayName("닉네임 중복 확인 요청")
    void isNicknameDuplicateTest() {
        // given: 중복된 닉네임의 사용자가 존재할 때
        SignupRequestDto dto = createSignupDto("nicktest@ssafy.com", "test1234!", "test");
        authService.signUp(dto);

        // when: 사용하려는 닉네임이 DB에 있는지 확인한다면
        boolean isDuplicated = authService.isNicknameDuplicate("test");
        boolean isNotDuplicated = authService.isNicknameDuplicate("test2");

        // then: DB에 있으면 True, 없으면 False를 반환한다
        Assertions.assertTrue(isDuplicated, "이미 존재하는 닉네임은 true를 반환해야 합니다.");
        Assertions.assertFalse(isNotDuplicated, "새로운 닉네임은 false를 반환해야 합니다.");
    }

    @Test
    @DisplayName("중복 닉네임 가입 시 예외 발생")
    void duplicateNicknameTest() {
        // given: 중복된 닉네임의 사용자가 존재할 때
        SignupRequestDto dto1 = createSignupDto("test1@ssafy.com", "test1234!", "kitty");
        authService.signUp(dto1);

        // when: 중복된 닉네임을 사용하여 회원가입을 시도한다면
        SignupRequestDto dto2 = createSignupDto("test2@ssafy.com", "test1234!", "kitty");

        // then: DuplicateNicknameException 예외가 발생한다
        BaseException ex = Assertions.assertThrows(BaseException.class, () -> {
            authService.signUp(dto2);
        });
        Assertions.assertEquals(ErrorCode.DUPLICATE_NICKNAME, ex.getErrorCode());
    }
}
