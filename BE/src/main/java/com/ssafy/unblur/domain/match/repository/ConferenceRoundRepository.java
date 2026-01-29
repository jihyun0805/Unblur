package com.ssafy.unblur.domain.match.repository;

import com.ssafy.unblur.domain.match.model.ConferenceRound;
import com.ssafy.unblur.domain.match.model.ConferenceRoundStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 세션 라운드 레포지토리
 */
public interface ConferenceRoundRepository extends JpaRepository<ConferenceRound, UUID> {

    /**
     * 세션 ID와 상태로 라운드를 조회하는 메서드
     *
     * @param conferenceId 세션 ID
     * @param status       라운드 상태
     * @return 라운드 정보
     */
    Optional<ConferenceRound> findFirstByConference_IdAndStatus(UUID conferenceId, ConferenceRoundStatus status);

    List<ConferenceRound> findByConference_IdOrderByRoundNumberAsc(UUID conferenceId);
}
