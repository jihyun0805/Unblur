package com.ssafy.unblur.domain.user;

import com.ssafy.unblur.global.CustomException;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users") // USER는 DB 예약어인 경우가 많아 users를 권장합니다.
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 보통 PK는 int보다 더 큰 범위를 수용하는 Long을 선호합니다.

    @Column(nullable = false, unique = true, length = 50)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true, length = 10)
    private String nickname;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private UserRole role; // USER, ADMIN

    /**
     * 회원가입 및 사용자 생성을 위한 생성자입니다.
     *
     * @param email    사용자 이메일 (로그인 ID)
     * @param password 암호화된 비밀번호
     * @param nickname 사용자 닉네임 (최대 10자)
     * @param role     사용자 권한 (USER, ADMIN)
     */
    public User(String email, String password, String nickname, UserRole role) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        this.role = role;
    }

    /**
     * SignupDto와 암호화된 비밀번호를 받아 User 엔티티를 생성합니다.
     *
     * @param dto             회원가입 정보
     * @param encodedPassword 암호화된 비밀번호
     * @return 생성된 User 엔티티
     */
    public static User from(SignupDto dto, String encodedPassword) {
        return new User(
                dto.getEmail(),
                encodedPassword,
                dto.getNickname(),
                UserRole.USER
        );
    }

    /**
     * 닉네임 변경 시 내부적으로 공백, 길이 검사합니다.
     *
     * @param newNickname 변경할 닉네임
     */
    public void updateNickname(String newNickname) {
        if (newNickname == null || newNickname.isBlank()) {
            throw new CustomException.BlankNicknameException();
        }

        String strippedNickname = newNickname.strip();

        if (strippedNickname.length() > 10) {
            throw new CustomException.NicknameLengthException();
        }
        this.nickname = strippedNickname;
    }

    /**
     * 사용자의 비밀번호를 새로운 값으로 변경합니다.
     * <p>보안을 위해 반드시 서비스 레이어에서 암호화된 비밀번호를 전달해야 합니다.</p>
     *
     * @param newPassword 암호화가 완료된 새 비밀번호
     */
    public void updatePassword(String newPassword) {
        this.password = newPassword;
    }
}