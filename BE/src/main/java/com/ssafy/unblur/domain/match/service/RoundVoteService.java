package com.ssafy.unblur.domain.match.service;

import com.ssafy.unblur.common.service.event.WsEventType;
import com.ssafy.unblur.common.util.TransactionUtils;
import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.auth.repository.UserRepository;
import com.ssafy.unblur.domain.match.model.*;
import com.ssafy.unblur.domain.match.repository.ConferenceRepository;
import com.ssafy.unblur.domain.match.repository.ConferenceRoundRepository;
import com.ssafy.unblur.domain.match.repository.RoundVoteRepository;
import com.ssafy.unblur.domain.rtc.dto.event.RoundMessages;
import com.ssafy.unblur.domain.rtc.service.KurentoRoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

/**
 * 라운드 투표 처리 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RoundVoteService {

    /**
     * 최대 라운드 수
     */
    private static final int MAX_ROUND = 4;

    /**
     * 투표 상태 저장소
     */
    private final RoundVoteStore voteStore;

    /**
     * 라운드 타이머 서비스
     */
    private final RoundTimerService timerService;

    /**
     * 매칭 이벤트 퍼블리셔
     */
    private final MatchEventPublisher eventPublisher;

    /**
     * 세션 저장소 레포지토리
     */
    private final ConferenceRepository conferenceRepository;

    /**
     * 라운드 저장소 레포지토리
     */
    private final ConferenceRoundRepository roundRepository;

    /**
     * 라운드 투표 저장소 레포지토리
     */
    private final RoundVoteRepository roundVoteRepository;

    /**
     * 사용자 저장소 레포지토리
     */
    private final UserRepository userRepository;

    /**
     * 기준 시각 제공용 Clock
     */
    private final Clock clock;

    /**
     * Kurento 녹음 서비스
     */
    private final KurentoRoomService kurentoRoomService;

    /**
     * 라운드 투표 처리 동시성 보호용 락
     */
    private final Map<UUID, ReentrantLock> voteLocks = new ConcurrentHashMap<>();

    /**
     * 투표를 처리하는 메서드
     *
     * @param conferenceId 세션 ID
     * @param userId       사용자 ID
     * @param vote         투표 선택지
     */
    @Transactional
    public void processVote(UUID conferenceId, UUID userId, VoteChoice vote) {
        ReentrantLock lock = voteLocks.computeIfAbsent(conferenceId, id -> new ReentrantLock());
        lock.lock();

        try {
            VoteState currentState = voteStore.getVoteState(conferenceId);
            List<UUID> participants = timerService.getParticipants(conferenceId);

            log.info("투표 처리. conferenceId={}, userId={}, vote={}, state={}", conferenceId, userId, vote, currentState);

            if (currentState == VoteState.COMPLETED) {
                log.info("이미 투표 완료 상태입니다. conferenceId={}", conferenceId);
                return;
            }

            // 재확인 상태인 경우
            if (currentState == VoteState.CONFIRMING) {
                handleConfirmingVote(conferenceId, userId, vote, participants);
                return;
            }

            // 일반 투표 처리
            voteStore.vote(conferenceId, userId, vote);
            int voteCount = voteStore.getTotalVoteCount(conferenceId);

            if (voteCount == 1) {
                voteStore.setVoteState(conferenceId, VoteState.PENDING);

            } else if (voteCount >= 2) {
                voteStore.setVoteState(conferenceId, VoteState.COMPLETED);
                processVoteResult(conferenceId, participants);
            }

        } finally {
            lock.unlock();
        }
    }

    /**
     * 재확인 투표 처리하는 메서드
     *
     * @param conferenceId 세션 ID
     * @param userId       사용자 ID
     * @param vote         투표 선택지
     * @param participants 참가자 ID 리스트
     */
    private void handleConfirmingVote(UUID conferenceId, UUID userId, VoteChoice vote, List<UUID> participants) {
        // 재확인 대상자(END 투표자) 조회
        Set<UUID> endVoterIds = voteStore.getEndVoterIds(conferenceId);
        if (endVoterIds.isEmpty() || !endVoterIds.contains(userId)) {
            log.warn("재확인 대상자가 아닌 사용자가 투표 시도. conferenceId={}, userId={}", conferenceId, userId);
            return;
        }

        // 진행 투표자 조회
        Set<UUID> proceedVoterIds = voteStore.getProceedVoterIds(conferenceId);
        if (proceedVoterIds.isEmpty()) {
            log.error("진행 투표자를 찾을 수 없습니다. conferenceId={}", conferenceId);
            return;
        }

        UUID proceedVoter = proceedVoterIds.iterator().next();

        if (vote == VoteChoice.PROCEED) {
            // 재확인 후 진행 동의 → 다음 라운드 (둘 다 true로 저장)
            saveVotesToDatabase(conferenceId, Map.of(userId, true, proceedVoter, true));
            advanceToNextRound(conferenceId, participants);

        } else {
            // 재확인 후에도 종료 → 세션 종료 (confirming user는 false, 상대방은 true)
            saveVotesToDatabase(conferenceId, Map.of(userId, false, proceedVoter, true));
            endConference(conferenceId, participants);
        }
    }

    /**
     * 투표 결과 처리하는 메서드
     *
     * @param conferenceId 세션 ID
     * @param participants 참가자 ID 리스트
     */
    private void processVoteResult(UUID conferenceId, List<UUID> participants) {
        int proceedCount = voteStore.getProceedVoterCount(conferenceId);
        int endCount = voteStore.getEndVoterCount(conferenceId);

        Set<UUID> proceedVoterIds = voteStore.getProceedVoterIds(conferenceId);
        Set<UUID> endVoterIds = voteStore.getEndVoterIds(conferenceId);

        log.info("투표 결과. conferenceId={}, proceed={}, end={}", conferenceId, proceedCount, endCount);

        if (proceedCount == 2) {
            // 둘 다 진행 동의 → 다음 라운드 (둘 다 true로 DB에 저장)
            saveVotesToDatabase(conferenceId, Map.of(
                    proceedVoterIds.stream().findFirst().orElseThrow(), true,
                    proceedVoterIds.stream().skip(1).findFirst().orElseThrow(), true
            ));
            advanceToNextRound(conferenceId, participants);

        } else if (endCount == 2) {
            // 둘 다 종료 동의 → 세션 종료 (둘 다 false로 DB에 저장)
            saveVotesToDatabase(conferenceId, Map.of(
                    endVoterIds.stream().findFirst().orElseThrow(), false,
                    endVoterIds.stream().skip(1).findFirst().orElseThrow(), false
            ));
            endConference(conferenceId, participants);

        } else {
            // 의견 불일치 → 거절자에게 재확인 요청 (DB에 아직 저장 안 함)
            handleConflict(conferenceId, proceedVoterIds, endVoterIds);
        }
    }

    /**
     * 최종 투표 결과를 DB에 저장하는 메서드
     *
     * @param conferenceId 세션 ID
     * @param finalVotes   사용자 ID와 투표 결과 매핑
     */
    private void saveVotesToDatabase(UUID conferenceId, Map<UUID, Boolean> finalVotes) {
        ConferenceRound activeRound = roundRepository.findFirstByConference_IdAndStatus(conferenceId, ConferenceRoundStatus.ACTIVE)
                .orElse(null);

        if (activeRound == null) {
            log.warn("활성 라운드를 찾을 수 없습니다. conferenceId={}", conferenceId);
            return;
        }

        for (Map.Entry<UUID, Boolean> entry : finalVotes.entrySet()) {
            UUID odlUserId = entry.getKey();
            boolean wantsContinue = entry.getValue();

            User user = userRepository.findById(odlUserId).orElse(null);
            if (user == null) {
                log.warn("사용자를 찾을 수 없습니다. odlUserId={}", odlUserId);
                continue;
            }

            RoundVote roundVote = RoundVote.builder()
                    .round(activeRound)
                    .user(user)
                    .wantsContinue(wantsContinue)
                    .build();

            roundVoteRepository.save(roundVote);

            log.info("투표 저장. roundId={}, odlUserId={}, wantsContinue={}", activeRound.getId(), odlUserId, wantsContinue);
        }
    }

    /**
     * 의견 불일치 시 거절자에게 재확인 요청하는 메서드
     *
     * @param conferenceId    세션 ID
     * @param proceedVoterIds PROCEED 투표자 ID 목록
     * @param endVoterIds     END 투표자 ID 목록
     */
    private void handleConflict(UUID conferenceId, Set<UUID> proceedVoterIds, Set<UUID> endVoterIds) {
        UUID endVoter = endVoterIds.iterator().next();
        UUID proceedVoter = proceedVoterIds.iterator().next();

        log.info("의견 불일치. conferenceId={}, proceedVoter={}, endVoter={}", conferenceId, proceedVoter, endVoter);

        // 재확인 상태로 전환 (투표 데이터는 유지 - 나중에 조회용)
        voteStore.setVoteState(conferenceId, VoteState.CONFIRMING);

        // 종료 선택자에게 재확인 요청
        RoundMessages.VoteConfirmRequest endVoterMessage = RoundMessages.VoteConfirmRequest.of(conferenceId.toString());
        eventPublisher.publish(endVoter, WsEventType.VOTE_CONFIRM_REQUEST, endVoterMessage);
    }

    /**
     * 다음 라운드로 진행하는 메서드
     *
     * @param conferenceId 세션 ID
     * @param participants 참가자 ID 리스트
     */
    private void advanceToNextRound(UUID conferenceId, List<UUID> participants) {
        LocalDateTime now = LocalDateTime.now(clock);

        Conference conference = conferenceRepository.findById(conferenceId).orElse(null);
        if (conference == null) {
            log.error("세션을 찾을 수 없습니다. conferenceId={}", conferenceId);
            return;
        }

        // 최대 라운드 체크
        if (conference.getCurrentRound() >= MAX_ROUND) {
            log.info("최대 라운드 도달. conferenceId={}", conferenceId);
            endConference(conferenceId, participants);
            return;
        }

        int currentRound = conference.getCurrentRound();

        // 현재 라운드 종료 처리
        roundRepository.findFirstByConference_IdAndStatus(conferenceId, ConferenceRoundStatus.ACTIVE)
                .ifPresent(round -> {
                    round.complete(now);
                    roundRepository.save(round);
                });

        // 다음 라운드로 진행
        conference.advanceRound();
        int nextRound = conference.getCurrentRound();

        // 새 라운드 생성
        ConferenceRound newRound = ConferenceRound.builder()
                .conference(conference)
                .roundNumber(nextRound)
                .startedAt(now)
                .status(ConferenceRoundStatus.ACTIVE)
                .build();

        roundRepository.save(newRound);
        conferenceRepository.save(conference);

        log.info("다음 라운드 시작. conferenceId={}, round={}", conferenceId, nextRound);

        TransactionUtils.runAfterCommit(() -> {
            // 현재 라운드 녹음 중지 및 업로드
            kurentoRoomService.stopRecordingAndUpload(conferenceId, currentRound);

            // 투표 리셋
            voteStore.resetVotes(conferenceId);

            // 양쪽에게 알림
            RoundMessages.RoundStarted message = RoundMessages.RoundStarted.builder()
                    .conferenceId(conferenceId.toString())
                    .roundNumber(nextRound)
                    .isUnlimited(nextRound >= MAX_ROUND)
                    .build();

            for (UUID userId : participants) {
                eventPublisher.publish(userId, WsEventType.ROUND_STARTED, message);
            }

            // 새 라운드 녹음 시작
            kurentoRoomService.startRecording(conferenceId, nextRound);

            // 새 라운드 타이머 시작
            timerService.startRoundTimer(conferenceId, nextRound, participants);
        });
    }

    /**
     * 세션을 종료하는 메서드
     *
     * @param conferenceId 세션 ID
     * @param participants 참가자 ID 리스트
     */
    private void endConference(UUID conferenceId, List<UUID> participants) {
        LocalDateTime now = LocalDateTime.now(clock);

        Conference conference = conferenceRepository.findById(conferenceId).orElse(null);
        if (conference == null) {
            log.error("세션을 찾을 수 없습니다. conferenceId={}", conferenceId);
            return;
        }

        int currentRound = conference.getCurrentRound();

        // 현재 라운드 종료 처리
        roundRepository.findFirstByConference_IdAndStatus(conferenceId, ConferenceRoundStatus.ACTIVE)
                .ifPresent(round -> {
                    round.complete(now);
                    roundRepository.save(round);
                });

        // 세션 종료
        conference.complete(now);
        conferenceRepository.save(conference);

        log.info("세션 종료. conferenceId={}", conferenceId);

        TransactionUtils.runAfterCommit(() -> {
            // 현재 라운드 녹음 중지 및 업로드
            kurentoRoomService.stopRecordingAndUpload(conferenceId, currentRound);

            // 양쪽에게 알림
            RoundMessages.ConferenceEnded message = RoundMessages.ConferenceEnded.of(conferenceId.toString());

            for (UUID userId : participants) {
                eventPublisher.publish(userId, WsEventType.CONFERENCE_ENDED, message);
            }

            // 타이머 정리
            timerService.cleanup(conferenceId);
            voteLocks.remove(conferenceId);
        });
    }

}
