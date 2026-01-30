package com.ssafy.unblur.domain.match.service;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.domain.auth.model.ClarityEvaluation;
import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.auth.repository.ClarityEvaluationRepository;
import com.ssafy.unblur.domain.auth.repository.UserRepository;
import com.ssafy.unblur.domain.match.model.Conference;
import com.ssafy.unblur.domain.match.model.ConferenceParticipant;
import com.ssafy.unblur.domain.match.model.ConferenceStatus;
import com.ssafy.unblur.domain.match.repository.ConferenceParticipantRepository;
import com.ssafy.unblur.domain.match.repository.ConferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClarityEvaluationService {

    /**
     * 사용자 리포지토리
     */
    private final UserRepository userRepository;

    /**
     * 컨퍼런스 리포지토리
     */
    private final ConferenceRepository conferenceRepository;

    /**
     * 컨퍼런스 참가자 리포지토리
     */
    private final ConferenceParticipantRepository conferenceParticipantRepository;

    /**
     * 선명도 평가 리포지토리
     */
    private final ClarityEvaluationRepository clarityEvaluationRepository;

    @Transactional
    public void evaluate(UUID conferenceId, String evaluatorEmail, int score) {
        // 평가자 및 컨퍼런스 조회
        User evaluator = userRepository.findByEmail(evaluatorEmail)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        Conference conference = conferenceRepository.findById(conferenceId)
                .orElseThrow(() -> new BaseException(ErrorCode.CONFERENCE_NOT_FOUND));

        // 컨퍼런스 상태 확인
        if (conference.getStatus() != ConferenceStatus.COMPLETED) {
            throw new BaseException(ErrorCode.CONFERENCE_NOT_COMPLETED);
        }

        // 평가자가 해당 컨퍼런스 참가자인지 확인
        List<ConferenceParticipant> participants = conferenceParticipantRepository.findByConferenceId(conferenceId);

        boolean isParticipant = participants.stream()
                .anyMatch(p -> p.getUser().getId().equals(evaluator.getId()));

        if (!isParticipant) {
            throw new BaseException(ErrorCode.CONFERENCE_NOT_PARTICIPANT);
        }

        // 평가 대상자 조회
        User target = participants.stream()
                .map(ConferenceParticipant::getUser)
                .filter(user -> !user.getId().equals(evaluator.getId()))
                .findFirst()
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        // 중복 평가 방지
        if (clarityEvaluationRepository.existsByEvaluator_IdAndTarget_IdAndConference_Id(evaluator.getId(), target.getId(), conferenceId)) {
            throw new BaseException(ErrorCode.CLARITY_EVALUATION_ALREADY_EXISTS);
        }

        int delta = score - 3;
        target.applyClarityDelta(delta);

        ClarityEvaluation evaluation = ClarityEvaluation.builder()
                .evaluator(evaluator)
                .target(target)
                .conference(conference)
                .score(score)
                .build();

        clarityEvaluationRepository.save(evaluation);

    }
}
