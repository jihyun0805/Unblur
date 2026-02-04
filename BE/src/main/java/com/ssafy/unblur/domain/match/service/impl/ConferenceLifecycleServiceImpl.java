package com.ssafy.unblur.domain.match.service.impl;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.auth.repository.UserRepository;
import com.ssafy.unblur.domain.match.model.*;
import com.ssafy.unblur.domain.match.repository.ConferenceParticipantRepository;
import com.ssafy.unblur.domain.match.repository.ConferenceRepository;
import com.ssafy.unblur.domain.match.repository.ConferenceRoundRepository;
import com.ssafy.unblur.common.service.EventSender;
import com.ssafy.unblur.common.service.event.WsEventType;
import com.ssafy.unblur.domain.match.service.ConferenceLifecycleService;
import com.ssafy.unblur.domain.match.service.RoundTimerService;
import com.ssafy.unblur.domain.rtc.dto.event.RoundMessages;
import com.ssafy.unblur.domain.rtc.service.KurentoRoomService;
import com.ssafy.unblur.common.util.TransactionUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.locks.ReentrantLock;

/**
 * 세션 입장/퇴장 이벤트를 DB에 기록하는 서비스 구현체
 * <p>
 * 매칭 완료 시 WAITING 상태로 생성된 세션을 기준으로, 실제 RTC 입장 시점에 참여자/라운드 정보를 기록한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ConferenceLifecycleServiceImpl implements ConferenceLifecycleService {

    /**
     * 세션 상태 저장 레포지토리
     */
    private final ConferenceRepository conferenceRepository;

    /**
     * 세션 참여자 저장/조회 레포지토리
     */
    private final ConferenceParticipantRepository participantRepository;

    /**
     * 세션 라운드 저장 레포지토리
     */
    private final ConferenceRoundRepository roundRepository;

    /**
     * 사용자 조회 레포지토리
     */
    private final UserRepository userRepository;

    /**
     * 라운드 타이머 서비스
     */
    private final RoundTimerService roundTimerService;

    /**
     * Kurento 녹음 서비스
     */
    private final KurentoRoomService kurentoRoomService;

    /**
     * 이벤트 전송기
     */
    private final EventSender eventSender;

    /**
     * 기준 시각 제공용 Clock
     */
    private final Clock clock;

    /**
     * 동시 입장/퇴장 처리 충돌을 막기 위한 락
     */
    private final ReentrantLock lifecycleLock = new ReentrantLock();

    /**
     * 사용자가 세션에 입장했을 때 상태를 기록하는 메서드
     * <p>
     * 첫 입장 시 참여자 레코드를 만들고, 상대방의 입장까지 완료되면 세션을 ACTIVE로 전환한 뒤 1라운드를 시작한다.
     *
     * @param conferenceId 세션 ID
     * @param userId       사용자 ID
     */
    @Override
    @Transactional
    public void onJoin(UUID conferenceId, UUID userId) {
        boolean unlockManually = lockUntilTxCompletion();

        try {
            log.info("세션 입장 처리 시작. conferenceId={}, userId={}", conferenceId, userId);

            // 세션과 사용자 존재 확인
            Conference conference = conferenceRepository.findById(conferenceId)
                    .orElseThrow(() -> new BaseException(ErrorCode.MATCH_REQUEST_NOT_FOUND));

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

            // 기존 참여 기록이 있으면 재입장 처리, 없으면 신규 생성
            Optional<ConferenceParticipant> existingParticipant = participantRepository.findByConference_IdAndUser_Id(conferenceId, userId);
            if (existingParticipant.isPresent()) {
                ConferenceParticipant participant = existingParticipant.get();

                // leftAt이 설정되어 있으면 초기화 (재연결)
                if (participant.getLeftAt() != null) {
                    participant.rejoin();
                }

            } else {
                // 신규 입장
                ConferenceParticipant participant = ConferenceParticipant.builder()
                        .conference(conference)
                        .user(user)
                        .joinedAt(LocalDateTime.now(clock))
                        .build();

                participantRepository.save(participant);
            }

            // 두 명이 모두 입장한 경우 세션을 활성화하고 1라운드 생성
            if (conference.getStatus() == ConferenceStatus.WAITING) {
                long activeCount = participantRepository.countByConference_IdAndLeftAtIsNull(conferenceId);
                log.info("세션 입장자 수 확인. conferenceId={}, activeCount={}", conferenceId, activeCount);

                if (activeCount >= 2) {
                    LocalDateTime now = LocalDateTime.now(clock);
                    conference.activate(now);

                    ConferenceRound round = ConferenceRound.builder()
                            .conference(conference)
                            .roundNumber(1)
                            .startedAt(now)
                            .status(ConferenceRoundStatus.ACTIVE)
                            .build();

                    roundRepository.save(round);

                    // 참여자 ID 목록을 가져와서 라운드 타이머 시작
                    List<UUID> participantIds = participantRepository.findByConference_IdAndLeftAtIsNull(conferenceId)
                            .stream()
                            .map(p -> p.getUser().getId())
                            .toList();

                    TransactionUtils.runAfterCommit(() -> {
                        // 1라운드 녹음 시작
                        kurentoRoomService.startRecording(conferenceId, 1);
                        roundTimerService.startRoundTimer(conferenceId, 1, participantIds);

                        // 양쪽에 round-started 전송 
                        RoundMessages.RoundStarted message = RoundMessages.RoundStarted.builder()
                                .conferenceId(conferenceId.toString())
                                .roundNumber(1)
                                .isUnlimited(false)
                                .build();

                        // 양쪽에 round 시작 이벤트 전송         
                        for (UUID participantId : participantIds) {
                            eventSender.publish(participantId, WsEventType.ROUND_STARTED, message);
                        }
                    });
                }
            }

        } finally {
            if (unlockManually) {
                lifecycleLock.unlock();
            }
        }
    }

    /**
     * 사용자가 세션에서 퇴장했을 때 상태를 기록하는 메서드
     * <p>
     * 한 명이라도 남지 않으면 세션과 진행 중 라운드를 종료한다.
     *
     * @param conferenceId 세션 ID
     * @param userId       사용자 ID
     */
    @Override
    @Transactional
    public void onLeave(UUID conferenceId, UUID userId) {
        boolean unlockManually = lockUntilTxCompletion();

        try {
            log.info("세션 퇴장 처리 시작. conferenceId={}, userId={}", conferenceId, userId);
            ConferenceParticipant participant = participantRepository.findByConference_IdAndUser_Id(conferenceId, userId)
                    .orElse(null);

            if (participant == null) {
                log.debug("퇴장 처리 대상 없음. conferenceId={}, userId={}", conferenceId, userId);
                return;
            }

            // 퇴장 시각 기록
            if (participant.getLeftAt() == null) {
                participant.markLeft(LocalDateTime.now(clock));
            }

            // 남아 있는 참여자가 1명 이하이면 세션/라운드 종료
            long activeCount = participantRepository.countByConference_IdAndLeftAtIsNull(conferenceId);
            log.info("세션 퇴장 후 남은 참여자 수. conferenceId={}, activeCount={}", conferenceId, activeCount);

            if (activeCount <= 1) {
                Conference conference = conferenceRepository.findById(conferenceId)
                        .orElse(null);

                // 세션이 아직 종료되지 않은 경우에만 종료 처리
                if (conference != null && conference.getStatus() != ConferenceStatus.COMPLETED) {
                    LocalDateTime now = LocalDateTime.now(clock);
                    conference.complete(now);
                    log.info("세션 종료 처리. conferenceId={}, endedAt={}", conferenceId, now);

                    // 진행 중이던 라운드 조회
                    ConferenceRound activeRound = roundRepository.findFirstByConference_IdAndStatus(conferenceId, ConferenceRoundStatus.ACTIVE)
                            .orElse(null);

                    // 진행 중이던 라운드 번호 저장 및 라운드 종료
                    Integer activeRoundNumber = null;
                    if (activeRound != null) {
                        activeRoundNumber = activeRound.getRoundNumber();
                        activeRound.complete(now);
                    }

                    // 남아 있는 참여자 목록 조회
                    List<ConferenceParticipant> remainingParticipants = participantRepository.findByConference_IdAndLeftAtIsNull(conferenceId);
                    List<UUID> remainingParticipantIds = remainingParticipants.stream()
                            .map(p -> p.getUser().getId())
                            .toList();

                    // 자동 종료 시 남아 있는 참여자도 퇴장 처리
                    for (ConferenceParticipant remaining : remainingParticipants) {
                        if (remaining.getLeftAt() == null) {
                            remaining.markLeft(now);
                        }
                    }

                    Integer finalActiveRoundNumber = activeRoundNumber;
                    TransactionUtils.runAfterCommit(() -> {
                        // 녹음 중지 및 업로드
                        if (finalActiveRoundNumber != null) {
                            kurentoRoomService.stopRecordingAndUpload(conferenceId, finalActiveRoundNumber);
                        }

                        // 라운드 타이머 정리
                        roundTimerService.cleanup(conferenceId);

                        if (!remainingParticipantIds.isEmpty()) {
                            // 세션 종료 메시지 생성
                            RoundMessages.ConferenceEnded message = RoundMessages.ConferenceEnded.of(conferenceId.toString());

                            // 남아있는 참여자들에게 세션 종료 알림 전송 및 퇴장 처리
                            for (UUID participantId : remainingParticipantIds) {
                                eventSender.publish(participantId, WsEventType.CONFERENCE_ENDED, message);
                                kurentoRoomService.leave(conferenceId, participantId);
                            }
                        }
                    });
                }
            }

        } finally {
            if (unlockManually) {
                lifecycleLock.unlock();
            }
        }
    }

    /**
     * 트랜잭션이 완료될 때까지 락을 유지하는 헬퍼 메서드
     *
     * @return 트랜잭션이 없어서 즉시 락을 해제해야 하면 true, 트랜잭션이 있어서 afterCompletion에서 락을 해제하도록 했으면 false
     */
    private boolean lockUntilTxCompletion() {
        lifecycleLock.lock();

        if (TransactionSynchronizationManager.isActualTransactionActive() && TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {

                @Override
                public void afterCompletion(int status) {
                    lifecycleLock.unlock();
                }
            });

            return false;
        }

        return true;
    }
}
