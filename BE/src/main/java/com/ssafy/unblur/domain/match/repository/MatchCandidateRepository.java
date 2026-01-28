package com.ssafy.unblur.domain.match.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * 매칭 후보 검색 레포지토리
 */
public interface MatchCandidateRepository {

    /**
     * 대기열 후보를 대상으로 유사도 기반 정렬을 수행하는 메서드
     * <p>
     * {@code candidateIds} 후보 목록을 대상으로 내 {@code vector}와 각 후보의 벡터 간 코사인 유사도를 계산한 뒤, 유사도 높은 순으로 반환한다.
     *
     * @param userId            요청 사용자 ID (자기 자신 제외 용도)
     * @param vector            요청 사용자 벡터 리터럴 (예: [0.1,0.2,...])
     * @param candidateIds      후보 사용자 ID 목록
     * @param gender            선호 성별
     * @param region            선호 지역
     * @param maxBirthDate 최대 생년월일 (ageMin 기준)
     * @param minBirthDate 최소 생년월일 (ageMax 기준)
     * @param limit             조회 수
     * @return 유사도 높은 순으로 정렬된 후보 목록
     */
    List<MatchCandidate> findQuickCandidates(UUID userId,
                                             String vector,
                                             List<UUID> candidateIds,
                                             String gender,
                                             String region,
                                             LocalDate maxBirthDate,
                                             LocalDate minBirthDate,
                                             int limit);

    /**
     * 매칭 후보 조회 결과
     *
     * @param id         사용자 ID
     * @param similarity 유사도 (코사인 유사도 기준)
     */
    record MatchCandidate(UUID id, Double similarity) {
    }
}
