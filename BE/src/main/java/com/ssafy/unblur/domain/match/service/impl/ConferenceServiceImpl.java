package com.ssafy.unblur.domain.match.service.impl;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.domain.match.dto.AdvanceRoundResponse;
import com.ssafy.unblur.domain.match.dto.RoundEndEvent;
import com.ssafy.unblur.domain.match.model.Conference;
import com.ssafy.unblur.domain.match.model.ConferenceParticipant;
import com.ssafy.unblur.domain.match.model.ConferenceRound;
import com.ssafy.unblur.domain.match.model.ConferenceRoundStatus;
import com.ssafy.unblur.domain.match.model.ConferenceStatus;
import com.ssafy.unblur.domain.match.model.MatchEventType;
import com.ssafy.unblur.domain.match.repository.ConferenceParticipantRepository;
import com.ssafy.unblur.domain.match.repository.ConferenceRepository;
import com.ssafy.unblur.domain.match.repository.ConferenceRoundRepository;
import com.ssafy.unblur.domain.match.service.ConferenceService;
import com.ssafy.unblur.domain.match.service.MatchEventPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * 세션(컨퍼런스) 라운드 관리 서비스 구현체
 */
@Service
@RequiredArgsConstructor
public class ConferenceServiceImpl implements ConferenceService {

    /**
     * 최대 라운드 수
     */
    private static final int MAX_ROUND = 4;

    /**
     * 세션 레포지토리
     */
    private final ConferenceRepository conferenceRepository;

    /**
     * 세션 참여자 레포지토리
     */
    private final ConferenceParticipantRepository participantRepository;

    /**
     * 세션 라운드 레포지토리
     */
    private final ConferenceRoundRepository roundRepository;

    /**
     * 매칭 이벤트 전송기
     */
    private final MatchEventPublisher eventPublisher;

    /**
     * 기준 시각 제공용 Clock
     */
    private final Clock clock;

    /**
     * 다음 라운드로 진행하거나 세션을 종료하는 메서드
     *
     * @param conferenceId 세션 ID
     * @param userId       요청자 사용자 ID
     * @param proceed      다음 라운드 진행 여부 (false면 세션 종료)
     * @return 라운드 전환 결과
     */
    @Override
    @Transactional
    public AdvanceRoundResponse advanceRound(UUID conferenceId, UUID userId, boolean proceed) {
        LocalDateTime now = LocalDateTime.now(clock);

        // 세션 조회
        Conference conference = conferenceRepository.findById(conferenceId)
                .orElseThrow(() -> new BaseException(ErrorCode.CONFERENCE_NOT_FOUND));

        // 참여자 권한 검증
        boolean isParticipant = participantRepository.findByConference_IdAndUser_Id(conferenceId, userId)
                .isPresent();
        if (!isParticipant) {
            throw new BaseException(ErrorCode.CONFERENCE_NOT_PARTICIPANT);
        }

        // 세션 상태 검증
        if (conference.getStatus() == ConferenceStatus.COMPLETED) {
            throw new BaseException(ErrorCode.CONFERENCE_ALREADY_COMPLETED);
        }

        // 현재 활성 라운드 종료 처리
        roundRepository.findFirstByConference_IdAndStatus(conferenceId, ConferenceRoundStatus.ACTIVE)
                .ifPresent(round -> round.complete(now));

        String resultStatus;

        if (proceed) {
            // 최대 라운드 도달 여부 확인
            if (conference.getCurrentRound() >= MAX_ROUND) {
                throw new BaseException(ErrorCode.CONFERENCE_MAX_ROUND_REACHED);
            }

            // 다음 라운드로 진행
            conference.advanceRound();

            // 새 라운드 생성
            ConferenceRound newRound = ConferenceRound.builder()
                    .conference(conference)
                    .roundNumber(conference.getCurrentRound())
                    .startedAt(now)
                    .status(ConferenceRoundStatus.ACTIVE)
                    .build();
            roundRepository.save(newRound);

            resultStatus = "active";
        } else {
            // 세션 종료
            conference.complete(now);
            resultStatus = "completed";
        }

        conferenceRepository.save(conference);

        // 모든 참여자에게 SSE 알림 전송
        notifyParticipants(conferenceId, userId, conference.getCurrentRound(), now);

        return AdvanceRoundResponse.builder()
                .conferenceId(conferenceId.toString())
                .currentRound(conference.getCurrentRound())
                .status(resultStatus)
                .build();
    }

    /**
     * 세션 참여자들에게 라운드 변경 알림을 전송하는 메서드
     *
     * @param conferenceId   세션 ID
     * @param requesterId    요청자 ID (알림 제외)
     * @param currentRound   현재 라운드
     * @param occurredAt     이벤트 발생 시각
     */
    private void notifyParticipants(UUID conferenceId, UUID requesterId, int currentRound, LocalDateTime occurredAt) {
        List<ConferenceParticipant> participants = participantRepository.findByConference_Id(conferenceId);

        RoundEndEvent event = RoundEndEvent.builder()
                .conferenceId(conferenceId.toString())
                .roundNumber(currentRound)
                .endedAt(occurredAt)
                .build();

        for (ConferenceParticipant participant : participants) {
            UUID participantUserId = participant.getUser().getId();
            // 요청자 본인에게는 알림 전송하지 않음
            if (!participantUserId.equals(requesterId)) {
                eventPublisher.publish(participantUserId, MatchEventType.ROUND_ENDED, event);
            }
        }
    }
}
