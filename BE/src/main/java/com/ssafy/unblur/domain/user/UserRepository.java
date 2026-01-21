package com.ssafy.unblur.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * 해당 이메일을 사용하는 사용자가 존재하는지 확인합니다.
     *
     * @param email 중복 여부를 확인할 이메일
     * @return 존재하면 true, 존재하지 않으면 false
     */
    boolean existsByEmail(String email);

    /**
     * 해당 닉네임을 사용하는 사용자가 존재하는지 확인합니다.
     *
     * @param nickname 중복 여부를 확인할 닉네임
     * @return 존재하면 true, 존재하지 않으면 false
     */
    boolean existsByNickname(String nickname);

    /**
     * 이메일을 기반으로 사용자를 조회합니다.
     *
     * @param email 조회할 사용자의 이메일
     * @return 해당 이메일을 가진 사용자를 포함하는 {@link Optional}.
     * 존재하지 않을 경우 빈 Optional을 반환합니다.
     */
    Optional<User> findByEmail(String email);

}