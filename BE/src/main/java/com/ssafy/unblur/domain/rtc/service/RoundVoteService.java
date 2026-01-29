package com.ssafy.unblur.domain.rtc.service;

import com.ssafy.unblur.common.service.event.WsEventType;
import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.auth.repository.UserRepository;
import com.ssafy.unblur.domain.match.model.Conference;
import com.ssafy.unblur.domain.match.model.ConferenceRound;
import com.ssafy.unblur.domain.match.model.ConferenceRoundStatus;
import com.ssafy.unblur.domain.match.model.RoundVote;
import com.ssafy.unblur.domain.match.repository.ConferenceRepository;
import com.ssafy.unblur.domain.match.repository.ConferenceRoundRepository;
import com.ssafy.unblur.domain.match.repository.RoundVoteRepository;
import com.ssafy.unblur.domain.match.service.MatchEventPublisher;
import com.ssafy.unblur.domain.rtc.dto.RoundMessages;
import com.ssafy.unblur.domain.rtc.model.VoteChoice;
import com.ssafy.unblur.domain.rtc.model.VoteState;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 라운드 투표 처리 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RoundVoteService {

    private static final int MAX_ROUND = 4;

    private final RoundVoteStore voteStore;
    private final RoundTimerService timerService;

    private final MatchEventPublisher eventPublisher;

    private final ConferenceRepository conferenceRepository;
    private final ConferenceRoundRepository roundRepository;
    private final RoundVoteRepository roundVoteRepository;
    private final UserRepository userRepository;
    private final Clock clock;

    /**
     * 투표를 처리하는 메서드
     */
    @Transactional
    public void processVote(UUID conferenceId, UUID userId, VoteChoice vote) {
        VoteState currentState = voteStore.getVoteState(conferenceId);
        List<UUID> participants = timerService.getParticipants(conferenceId);

        log.info("투표 처리. conferenceId={}, userId={}, vote={}, state={}",
                conferenceId, userId, vote, currentState);

        // 재확인 상태인 경우
        if (currentState == VoteState.CONFIRMING) {
            handleConfirmingVote(conferenceId, userId, vote, participants);
            return;
        }

        // 일반 투표 처리
        voteStore.vote(conferenceId, userId, vote);
        int voteCount = voteStore.getVoteCount(conferenceId);

        if (voteCount == 1) {
            // 첫 번째 투표: 상대방에게 알림
            voteStore.setVoteState(conferenceId, VoteState.PENDING);
            notifyPartnerVoted(conferenceId, userId, participants);

        } else if (voteCount >= 2) {
            // 두 번째 투표: 결과 판정
            voteStore.setVoteState(conferenceId, VoteState.COMPLETED);
            processVoteResult(conferenceId, participants);
        }
    }

    /**
     * 재확인 투표 처리
     */
    private void handleConfirmingVote(UUID conferenceId, UUID userId, VoteChoice vote, List<UUID> participants) {
        Optional<UUID> confirmingUser = voteStore.getConfirmingUser(conferenceId);

        // 재확인 대상자만 투표 가능
        if (confirmingUser.isEmpty() || !confirmingUser.get().equals(userId)) {
            log.warn("재확인 대상자가 아닌 사용자가 투표 시도. conferenceId={}, userId={}", conferenceId, userId);
            return;
        }

        // 상대방(PROCEED 선택자) 찾기
        UUID proceedVoter = participants.stream()
                .filter(id -> !id.equals(userId))
                .findFirst()
                .orElse(null);

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
     * 투표 결과 처리
     */
    private void processVoteResult(UUID conferenceId, List<UUID> participants) {
        Map<UUID, VoteChoice> votes = voteStore.getAllVotes(conferenceId);

        long proceedCount = votes.values().stream().filter(v -> v == VoteChoice.PROCEED).count();
        long endCount = votes.values().stream().filter(v -> v == VoteChoice.END).count();

        log.info("투표 결과. conferenceId={}, proceed={}, end={}", conferenceId, proceedCount, endCount);

        if (proceedCount == 2) {
            // 둘 다 진행 동의 → 다음 라운드 (둘 다 true로 저장)
            saveVotesToDatabase(conferenceId, votes.entrySet().stream()
                    .collect(Collectors.toMap(Map.Entry::getKey, e -> true)));
            advanceToNextRound(conferenceId, participants);

        } else if (endCount == 2) {
            // 둘 다 종료 동의 → 세션 종료 (둘 다 false로 저장)
            saveVotesToDatabase(conferenceId, votes.entrySet().stream()
                    .collect(Collectors.toMap(Map.Entry::getKey, e -> false)));
            endConference(conferenceId, participants);

        } else {
            // 의견 불일치 → 거절자에게 재확인 요청 (아직 저장 안 함)
            handleConflict(conferenceId, votes, participants);
        }
    }

    /**
     * 최종 투표 결과를 DB에 저장
     */
    private void saveVotesToDatabase(UUID conferenceId, Map<UUID, Boolean> finalVotes) {
        ConferenceRound activeRound = roundRepository
                .findFirstByConference_IdAndStatus(conferenceId, ConferenceRoundStatus.ACTIVE)
                .orElse(null);

        if (activeRound == null) {
            log.warn("활성 라운드를 찾을 수 없습니다. conferenceId={}", conferenceId);
            return;
        }

        for (Map.Entry<UUID, Boolean> entry : finalVotes.entrySet()) {
            UUID odlUserId = entry.getKey();
            boolean wantsContinue = entry.getValue();

            // 기존 투표가 있으면 업데이트, 없으면 생성
            RoundVote roundVote = roundVoteRepository
                    .findByRound_IdAndUser_Id(activeRound.getId(), odlUserId)
                    .orElseGet(() -> {
                        User user = userRepository.findById(odlUserId).orElse(null);
                        if (user == null) {
                            log.warn("사용자를 찾을 수 없습니다. odlUserId={}", odlUserId);
                            return null;
                        }
                        return RoundVote.builder()
                                .round(activeRound)
                                .user(user)
                                .wantsContinue(wantsContinue)
                                .build();
                    });

            if (roundVote != null) {
                roundVote.updateVote(wantsContinue);
                roundVoteRepository.save(roundVote);
                log.info("투표 저장. roundId={}, odlUserId={}, wantsContinue={}",
                        activeRound.getId(), odlUserId, wantsContinue);
            }
        }
    }

    /**
     * 의견 불일치 시 거절자에게 재확인 요청
     */
    private void handleConflict(UUID conferenceId, Map<UUID, VoteChoice> votes, List<UUID> participants) {
        UUID endVoter = votes.entrySet().stream()
                .filter(e -> e.getValue() == VoteChoice.END)
                .map(Map.Entry::getKey)
                .findFirst()
                .orElse(null);

        UUID proceedVoter = votes.entrySet().stream()
                .filter(e -> e.getValue() == VoteChoice.PROCEED)
                .map(Map.Entry::getKey)
                .findFirst()
                .orElse(null);

        if (endVoter == null || proceedVoter == null) {
            log.error("투표 결과 파싱 오류. conferenceId={}", conferenceId);
            return;
        }

        log.info("의견 불일치. conferenceId={}, proceedVoter={}, endVoter={}", conferenceId, proceedVoter, endVoter);

        // 투표 리셋 및 재확인 상태로 전환
        voteStore.resetVotes(conferenceId);
        voteStore.setVoteState(conferenceId, VoteState.CONFIRMING);
        voteStore.setConfirmingUser(conferenceId, endVoter);

        // 종료 선택자에게 재확인 요청
        RoundMessages.VoteConfirmRequest endVoterMessage = RoundMessages.VoteConfirmRequest.of(conferenceId.toString());
        eventPublisher.publish(endVoter, WsEventType.VOTE_CONFIRM_REQUEST, endVoterMessage);

        // 진행 선택자에게 대기 알림
        RoundMessages.VoteWaitingConfirm proceedVoterMessage = RoundMessages.VoteWaitingConfirm.of(conferenceId.toString());
        eventPublisher.publish(proceedVoter, WsEventType.VOTE_WAITING_CONFIRM, proceedVoterMessage);
    }

    /**
     * 다음 라운드로 진행
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

        // 새 라운드 타이머 시작
        timerService.startRoundTimer(conferenceId, nextRound, participants);
    }

    /**
     * 세션 종료
     */
    private void endConference(UUID conferenceId, List<UUID> participants) {
        LocalDateTime now = LocalDateTime.now(clock);

        Conference conference = conferenceRepository.findById(conferenceId).orElse(null);
        if (conference == null) {
            log.error("세션을 찾을 수 없습니다. conferenceId={}", conferenceId);
            return;
        }

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

        // 양쪽에게 알림
        RoundMessages.ConferenceEnded message = RoundMessages.ConferenceEnded.of(conferenceId.toString());

        for (UUID userId : participants) {
            eventPublisher.publish(userId, WsEventType.CONFERENCE_ENDED, message);
        }

        // 타이머 정리
        timerService.cleanup(conferenceId);
    }

    /**
     * 상대방에게 투표 알림
     */
    private void notifyPartnerVoted(UUID conferenceId, UUID voterId, List<UUID> participants) {
        RoundMessages.PartnerVoted message = RoundMessages.PartnerVoted.of(conferenceId.toString());

        for (UUID userId : participants) {
            if (!userId.equals(voterId)) {
                eventPublisher.publish(userId, WsEventType.PARTNER_VOTED, message);
            }
        }
    }
}
