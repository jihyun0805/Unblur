package com.ssafy.unblur.domain.match.repository;

import com.ssafy.unblur.domain.auth.model.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * 매칭 대기열 후보 조회 전용 레포지토리
 * <p>
 * 대기열에 등록된 사용자 중 성별·지역·나이 필터와 차단 관계를 적용하여
 * 매칭 가능한 후보 목록을 반환한다.
 */
public interface MatchableUserRepository extends Repository<User, UUID> {

    @Query(
            value = """
                    SELECT u.*
                    FROM users u
                    WHERE u.id IN (:candidateIds)
                      AND u.id <> :userId
                      AND u.is_active = true
                      AND (:gender IS NULL OR u.gender = cast(:gender as varchar))
                      AND (:region IS NULL OR u.region = cast(:region as varchar))
                      AND u.birth_date <= coalesce(cast(:maxBirthDate as date), u.birth_date)
                      AND u.birth_date >= coalesce(cast(:minBirthDate as date), u.birth_date)
                      AND NOT EXISTS (
                        SELECT 1 FROM user_blocks b
                        WHERE (b.blocker_id = :userId AND b.blocked_id = u.id)
                           OR (b.blocker_id = u.id AND b.blocked_id = :userId)
                      )
                    """,
            nativeQuery = true
    )
    List<User> findMatchingCandidates(@Param("userId") UUID userId,
                                      @Param("candidateIds") List<UUID> candidateIds,
                                      @Param("gender") String gender,
                                      @Param("region") String region,
                                      @Param("maxBirthDate") LocalDate maxBirthDate,
                                      @Param("minBirthDate") LocalDate minBirthDate);
}
