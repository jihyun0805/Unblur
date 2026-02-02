package com.ssafy.unblur.domain.match.repository;

import com.ssafy.unblur.domain.auth.model.User;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * 매칭 후보 검색 레포지토리
 */
public interface MatchCandidateRepository {

    /**
     * 대기열 후보 중 성별·지역·나이·차단 필터를 적용하여 매칭 가능한 사용자를 조회한다.
     *
     * @param userId       요청 사용자 ID (자기 자신 제외 용도)
     * @param candidateIds 후보 사용자 ID 목록
     * @param gender       선호 성별
     * @param region       선호 지역
     * @param loveDna      선호 Love DNA
     * @param maxBirthDate 최대 생년월일 (ageMin 기준)
     * @param minBirthDate 최소 생년월일 (ageMax 기준)
     * @return 필터를 통과한 후보 목록
     */
    List<User> findMatchingCandidates(UUID userId,
                                      List<UUID> candidateIds,
                                      String gender,
                                      String region,
                                      String loveDna,
                                      LocalDate maxBirthDate,
                                      LocalDate minBirthDate);
}
