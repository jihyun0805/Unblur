package com.ssafy.unblur.domain.user;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users") // USER는 DB 예약어인 경우가 많아 users를 권장합니다.
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
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
}