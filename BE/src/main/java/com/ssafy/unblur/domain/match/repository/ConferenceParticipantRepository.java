package com.ssafy.unblur.domain.match.repository;

import com.ssafy.unblur.domain.match.model.ConferenceParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

/**
 * 세션 참여자 레포지토리
 */
public interface ConferenceParticipantRepository extends JpaRepository<ConferenceParticipant, UUID> {
}
