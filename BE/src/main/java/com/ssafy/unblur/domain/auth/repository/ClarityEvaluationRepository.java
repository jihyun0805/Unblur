package com.ssafy.unblur.domain.auth.repository;

import com.ssafy.unblur.domain.auth.model.ClarityEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ClarityEvaluationRepository extends JpaRepository<ClarityEvaluation, UUID> {

    boolean existsByEvaluator_IdAndTarget_IdAndConference_Id(UUID evaluatorId, UUID targetId, UUID conferenceId);
}
