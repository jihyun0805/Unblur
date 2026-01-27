package com.ssafy.unblur.domain.match.service.impl;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.auth.repository.UserRepository;
import com.ssafy.unblur.domain.match.model.Conference;
import com.ssafy.unblur.domain.match.model.ConferenceParticipant;
import com.ssafy.unblur.domain.match.model.ConferenceRound;
import com.ssafy.unblur.domain.match.model.ConferenceRoundStatus;
import com.ssafy.unblur.domain.match.model.ConferenceStatus;
import com.ssafy.unblur.domain.match.repository.ConferenceParticipantRepository;
import com.ssafy.unblur.domain.match.repository.ConferenceRepository;
import com.ssafy.unblur.domain.match.repository.ConferenceRoundRepository;
import com.ssafy.unblur.domain.match.service.ConferenceLifecycleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.locks.ReentrantLock;

/**
 * 세션 입장/퇴장 이벤트를 DB에 기록하는 서비스 구현체
 * <p>
 * 매칭 완료 시 WAITING 상태로 생성된 세션을 기준으로,
 * 실제 RTC 입장 시점에 참여자/라운드 정보를 기록한다.
 * </p>
 */
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
     * 첫 입장 시 참여자 레코드를 만들고, 두 번째 입장까지 완료되면
     * 세션을 ACTIVE로 전환한 뒤 1라운드를 시작한다.
     * </p>
     *
     * @param conferenceId 세션 ID
     * @param userId       사용자 ID
     */
    @Override
    @Transactional
    public void onJoin(UUID conferenceId, UUID userId) {
        // 세션과 사용자 존재 확인
        Conference conference = conferenceRepository.findById(conferenceId)
                .orElseThrow(() -> new BaseException(ErrorCode.MATCH_REQUEST_NOT_FOUND));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        // 참여자 기록이 없으면 신규 생성
        ConferenceParticipant participant = participantRepository.findByConference_IdAndUser_Id(conferenceId, userId)
                .orElseGet(() -> participantRepository.save(
                        ConferenceParticipant.builder()
                                .conference(conference)
                                .user(user)
                                .build()
                ));

        // 재입장인 경우 퇴장 시각 초기화
        if (participant.getLeftAt() != null) {
            participant.rejoin();
        }

        lifecycleLock.lock();
        try {
            // 두 명이 모두 입장한 경우 세션을 활성화하고 1라운드 생성
            if (conference.getStatus() == ConferenceStatus.WAITING) {
                long activeCount = participantRepository.countByConference_IdAndLeftAtIsNull(conferenceId);
                if (activeCount >= 2) {
                    LocalDateTime now = LocalDateTime.now(clock);
                    conference.activate(now);
                    conferenceRepository.save(conference);

                    ConferenceRound round = ConferenceRound.builder()
                            .conference(conference)
                            .roundNumber(1)
                            .startedAt(now)
                            .status(ConferenceRoundStatus.ACTIVE)
                            .build();
                    roundRepository.save(round);
                }
            }

        } finally {
            lifecycleLock.unlock();
        }
    }

    /**
     * 사용자가 세션에서 퇴장했을 때 상태를 기록하는 메서드
     * <p>
     * 마지막 참여자가 나가면 세션과 진행 중 라운드를 종료한다.
     * </p>
     *
     * @param conferenceId 세션 ID
     * @param userId       사용자 ID
     */
    @Override
    @Transactional
    public void onLeave(UUID conferenceId, UUID userId) {
        ConferenceParticipant participant = participantRepository.findByConference_IdAndUser_Id(conferenceId, userId)
                .orElse(null);

        if (participant == null) {
            return;
        }

        // 퇴장 시각 기록
        if (participant.getLeftAt() == null) {
            participant.markLeft(LocalDateTime.now(clock));
        }

        lifecycleLock.lock();
        try {
            // 남아 있는 참여자가 없으면 세션/라운드 종료
            long activeCount = participantRepository.countByConference_IdAndLeftAtIsNull(conferenceId);
            if (activeCount == 0) {
                Conference conference = conferenceRepository.findById(conferenceId)
                        .orElse(null);

                if (conference != null && conference.getStatus() != ConferenceStatus.COMPLETED) {
                    LocalDateTime now = LocalDateTime.now(clock);
                    conference.complete(now);
                    conferenceRepository.save(conference);

                    roundRepository.findFirstByConference_IdAndStatus(conferenceId, ConferenceRoundStatus.ACTIVE)
                            .ifPresent(round -> round.complete(now));
                }
            }

        } finally {
            lifecycleLock.unlock();
        }
    }
}
