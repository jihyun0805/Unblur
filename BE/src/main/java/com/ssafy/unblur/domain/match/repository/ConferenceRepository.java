package com.ssafy.unblur.domain.match.repository;

import com.ssafy.unblur.domain.match.model.Conference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

/**
 * 세션 레포지토리
 */
public interface ConferenceRepository extends JpaRepository<Conference, UUID> {
}
