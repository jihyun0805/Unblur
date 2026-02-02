package com.ssafy.unblur.domain.user.repository;

import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.auth.model.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface UserBlockRepository extends JpaRepository<UserBlock, UUID> {
    /**
     * 이미 차단한 관계인지 확인합니다.
     */
    boolean existsByBlockerAndBlocked(User blocker, User blocked);

    @Query("""
            select ub.blocked.id
            from UserBlock ub
            where ub.blocker = :blocker
              and ub.blocked.id in :blockedIds
            """)
    List<UUID> findBlockedIdsByBlockerAndBlockedIdIn(
            @Param("blocker") User blocker,
            @Param("blockedIds") Collection<UUID> blockedIds
    );

    /**
     * 차단 해제 시 사용할 수 있도록 차단 정보를 삭제합니다.
     */
    void deleteByBlockerAndBlocked(User blocker, User blocked);
}


