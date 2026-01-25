package com.ssafy.unblur.domain.match.repository.impl;

import com.ssafy.unblur.domain.match.repository.MatchCandidateRepository;
import com.ssafy.unblur.domain.user.model.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * PostgreSQL 기반 매칭 후보 검색 레포지토리
 * <p>
 * 인메모리 큐에서 전달된 후보 ID 목록을 대상으로 pgvector 유사도 계산을 수행한다.
 * </p>
 */
public interface PostgresMatchCandidateRepository extends MatchCandidateRepository, Repository<User, UUID> {

    @Override
    @Query(
            value = """
                    select u.id as id,
                           (1 - (u.interests_vector <=> cast(:vector as vector))) as similarity
                    from users u
                    where u.id in (:candidateIds)
                      and u.id <> :userId
                      and u.is_active = true
                      and u.is_online = true
                      and u.interests_vector is not null
                      and (:gender is null or u.gender = cast(:gender as varchar))
                      and (:region is null or u.region = cast(:region as varchar))
                      and u.birth_date <= coalesce(cast(:latestBirthDate as date), u.birth_date)
                      and u.birth_date >= coalesce(cast(:earliestBirthDate as date), u.birth_date)
                      and not exists (
                        select 1 from user_blocks b
                        where (b.blocker_id = :userId and b.blocked_id = u.id)
                           or (b.blocker_id = u.id and b.blocked_id = :userId)
                      )
                    order by u.interests_vector <=> cast(:vector as vector)
                    limit :limit
                    """,
            nativeQuery = true
    )
    List<MatchCandidate> findQuickCandidates(@Param("userId") UUID userId,
                                             @Param("vector") String vector,
                                             @Param("candidateIds") List<UUID> candidateIds,
                                             @Param("gender") String gender,
                                             @Param("region") String region,
                                             @Param("latestBirthDate") LocalDate latestBirthDate,
                                             @Param("earliestBirthDate") LocalDate earliestBirthDate,
                                             @Param("limit") int limit);
}
