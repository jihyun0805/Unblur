package com.ssafy.unblur.domain.user.repository;

import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.auth.model.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface UserBlockRepository extends JpaRepository<UserBlock, UUID> {
    /**
     * 이미 차단한 관계인지 확인합니다.
     */
    boolean existsByBlockerAndBlocked(User blocker, User blocked);

    /**
     * 차단 해제 시 사용할 수 있도록 차단 정보를 삭제합니다.
     */
    void deleteByBlockerAndBlocked(User blocker, User blocked);
}


