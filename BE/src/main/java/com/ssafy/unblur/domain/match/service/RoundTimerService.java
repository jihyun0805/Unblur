package com.ssafy.unblur.domain.match.service;

import com.ssafy.unblur.common.service.EventSender;
import com.ssafy.unblur.common.service.event.WsEventType;
import com.ssafy.unblur.domain.match.config.MatchConfig.RoundDurationPolicy;
import com.ssafy.unblur.domain.match.model.VoteState;
import com.ssafy.unblur.domain.rtc.dto.event.RoundMessages;
import com.ssafy.unblur.domain.rtc.service.RtcParticipantStore;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.*;

/**
 * 라운드 타이머 관리 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RoundTimerService {

    /**
     * 스케줄러 서비스
     */
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);

    /**
     * 활성화된 타이머 저장 맵
     * <p>
     * Key: 세션 ID, Value: 타이머 Future 객체
     */
    private final Map<UUID, ScheduledFuture<?>> activeTimers = new ConcurrentHashMap<>();

    /**
     * 라운드 지속 시간 정책
     */
    private final RoundDurationPolicy durationPolicy;

    /**
     * RTC 참가자 저장소
     */
    private final RtcParticipantStore participantStore;

    /**
     * 라운드 투표 저장소
     */
    private final RoundVoteStore voteStore;

    /**
     * 이벤트 전송기
     */
    private final EventSender eventSender;

    /**
     * 라운드 시작 시 타이머를 등록하는 메서드
     *
     * @param conferenceId   세션 ID
     * @param roundNumber    라운드 번호
     * @param participantIds 참가자 ID 목록
     */
    public void startRoundTimer(UUID conferenceId, int roundNumber, List<UUID> participantIds) {
        Duration duration = durationPolicy.getDuration(roundNumber);

        if (durationPolicy.isUnlimited(roundNumber)) { // 시간 제한이 없는 경우
            log.info("라운드 {} 시작 (무제한). conferenceId={}", roundNumber, conferenceId);
            voteStore.setVoteState(conferenceId, VoteState.WAITING);
            return;
        }

        // 기존 타이머 취소
        cancelTimer(conferenceId);

        // 투표 상태 초기화
        voteStore.resetVotes(conferenceId);
        voteStore.setVoteState(conferenceId, VoteState.IN_PROGRESS);

        log.info("라운드 {} 시작. conferenceId={}, duration={}분", roundNumber, conferenceId, duration.toMinutes());

        // 새 타이머 등록
        ScheduledFuture<?> future = scheduler.schedule(
                () -> onRoundTimeUp(conferenceId, roundNumber),
                duration.toSeconds(),
                TimeUnit.SECONDS
        );

        activeTimers.put(conferenceId, future);
    }

    /**
     * 라운드 시간 종료 시 호출되는 메서드
     *
     * @param conferenceId 세션 ID
     * @param roundNumber  라운드 번호
     */
    private void onRoundTimeUp(UUID conferenceId, int roundNumber) {
        // 타이머 제거
        activeTimers.remove(conferenceId);

        log.info("라운드 {} 시간 종료. conferenceId={}", roundNumber, conferenceId);

        // 투표 상태를 대기로 설정
        voteStore.setVoteState(conferenceId, VoteState.WAITING);
        voteStore.resetSkips(conferenceId);

        // 시간 종료 메시지 생성
        RoundMessages.RoundTimeUp message = RoundMessages.RoundTimeUp.of(conferenceId.toString(), roundNumber);

        // 참가자들에게 메시지 전송
        List<UUID> participants = participantStore.getParticipantIds(conferenceId);
        for (UUID userId : participants) {
            eventSender.publish(userId, WsEventType.ROUND_ENDED, message);
        }
    }

    /**
     * 타이머를 취소하는 메서드
     */
    public void cancelTimer(UUID conferenceId) {
        ScheduledFuture<?> future = activeTimers.remove(conferenceId);
        if (future != null) {
            future.cancel(false);
            log.info("라운드 타이머 취소. conferenceId={}", conferenceId);
        }
    }

    /**
     * 세션 종료 시 타이머 및 상태를 정리하는 메서드
     */
    public void cleanup(UUID conferenceId) {
        cancelTimer(conferenceId);
        participantStore.clear(conferenceId);
        voteStore.clear(conferenceId);
        log.info("라운드 타이머 정리 완료. conferenceId={}", conferenceId);
    }

    /**
     * 참가자 목록을 조회하는 메서드
     */
    public List<UUID> getParticipants(UUID conferenceId) {
        List<UUID> participants = participantStore.getParticipantIds(conferenceId);
        log.debug("라운드 참가자 조회. conferenceId={}, count={}", conferenceId, participants.size());

        return participants;
    }

    /**
     * 서비스 종료 시 스케줄러를 정상 종료하는 메서드
     */
    @PreDestroy
    public void shutdown() {
        scheduler.shutdown();

        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }

        } catch (InterruptedException e) {
            scheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}
