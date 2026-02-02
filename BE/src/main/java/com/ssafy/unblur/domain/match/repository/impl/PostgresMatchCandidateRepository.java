package com.ssafy.unblur.domain.match.repository.impl;

import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.match.repository.MatchCandidateRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * {@link MatchCandidateRepository}의 PostgreSQL 네이티브 쿼리 구현체.
 * <p>
 * 성별·지역·Love DNA·나이 범위 필터와 차단 관계 배제를 단일 네이티브 쿼리로 처리한다.
 */
public interface PostgresMatchCandidateRepository
        extends MatchCandidateRepository, Repository<User, UUID> {

    @Override
    @Query(
            value = """
                    SELECT u.*
                    FROM users u
                    WHERE u.id IN (:candidateIds)
                      AND u.id <> :userId
                      AND u.is_active = true
                      AND (:gender IS NULL OR u.gender = cast(:gender as varchar))
                      AND (:region IS NULL OR u.region = cast(:region as varchar))
                      AND (:loveDna IS NULL OR u.love_dna = cast(:loveDna as varchar))
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
                                      @Param("loveDna") String loveDna,
                                      @Param("maxBirthDate") LocalDate maxBirthDate,
                                      @Param("minBirthDate") LocalDate minBirthDate);
}
