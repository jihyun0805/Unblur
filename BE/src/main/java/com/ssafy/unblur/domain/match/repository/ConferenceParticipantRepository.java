package com.ssafy.unblur.domain.match.repository;

import com.ssafy.unblur.domain.match.model.ConferenceParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 세션 참여자 레포지토리
 */
public interface ConferenceParticipantRepository extends JpaRepository<ConferenceParticipant, UUID> {

    /**
     * 세션과 사용자로 참여 정보를 조회하는 메서드
     *
     * @param conferenceId 세션 ID
     * @param userId       사용자 ID
     * @return 참여 정보
     */
    Optional<ConferenceParticipant> findByConference_IdAndUser_Id(UUID conferenceId, UUID userId);

    /**
     * 세션 내 현재 입장 중인 참여자 수를 조회하는 메서드
     *
     * @param conferenceId 세션 ID
     * @return 입장 중인 참여자 수
     */
    long countByConference_IdAndLeftAtIsNull(UUID conferenceId);

    /**
     * 세션의 모든 참여자를 조회하는 메서드
     *
     * @param conferenceId 세션 ID
     * @return 참여자 목록
     */
    List<ConferenceParticipant> findByConference_Id(UUID conferenceId);
}
