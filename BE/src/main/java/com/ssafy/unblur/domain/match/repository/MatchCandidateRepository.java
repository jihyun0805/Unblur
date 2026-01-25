package com.ssafy.unblur.domain.match.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * 매칭 후보 검색 레포지토리
 */
public interface MatchCandidateRepository {

    /**
     * 대기열 후보를 검색
     *
     * @param userId            요청 사용자 ID
     * @param vector            요청 사용자 벡터 리터럴
     * @param candidateIds      후보 사용자 ID 목록
     * @param gender            선호 성별
     * @param region            선호 지역
     * @param latestBirthDate   최대 생년월일 (ageMin 기준)
     * @param earliestBirthDate 최소 생년월일 (ageMax 기준)
     * @param limit             조회 수
     * @return 후보 목록
     */
    List<MatchCandidate> findQuickCandidates(UUID userId,
                                             String vector,
                                             List<UUID> candidateIds,
                                             String gender,
                                             String region,
                                             LocalDate latestBirthDate,
                                             LocalDate earliestBirthDate,
                                             int limit);

    /**
     * 매칭 후보 조회 결과
     *
     * @param id         사용자 ID
     * @param similarity 유사도
     */
    record MatchCandidate(UUID id, Double similarity) {
    }
}
