package com.ssafy.unblur.domain.rtc.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.unblur.domain.match.config.MatchConfig.RoundDurationPolicy;
import com.ssafy.unblur.domain.rtc.dto.RoundMessages;
import com.ssafy.unblur.domain.rtc.model.VoteState;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

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
     * 세션별 참가자 목록 저장 맵
     * <p>
     * Key: 세션 ID, Value: 참가자 ID 목록
     */
    private final Map<UUID, List<UUID>> conferenceParticipants = new ConcurrentHashMap<>();

    /**
     * 라운드 지속 시간 정책
     */
    private final RoundDurationPolicy durationPolicy;

    /**
     * RTC 세션 저장소
     */
    private final RtcSessionStore sessionStore;

    /**
     * 라운드 투표 저장소
     */
    private final RoundVoteStore voteStore;

    /**
     * JSON 객체 매퍼
     */
    private final ObjectMapper objectMapper;

    /**
     * 라운드 시작 시 타이머를 등록하는 메서드
     *
     * @param conferenceId   세션 ID
     * @param roundNumber    라운드 번호
     * @param participantIds 참가자 ID 목록
     */
    public void startRoundTimer(UUID conferenceId, int roundNumber, List<UUID> participantIds) {
        Duration duration = durationPolicy.getDuration(roundNumber);

        // 참가자 목록 저장
        conferenceParticipants.put(conferenceId, participantIds);

        // 무제한이면 타이머 설정 안함
        if (durationPolicy.isUnlimited(roundNumber)) {
            log.info("라운드 {} 시작 (무제한). conferenceId={}", roundNumber, conferenceId);
            return;
        }

        // 기존 타이머 취소
        cancelTimer(conferenceId);

        // 투표 상태 초기화
        voteStore.resetVotes(conferenceId);

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

        // 시간 종료 메시지 생성
        RoundMessages.RoundTimeUp message = RoundMessages.RoundTimeUp.of(conferenceId.toString(), roundNumber);

        // 참가자들에게 메시지 전송
        List<UUID> participants = conferenceParticipants.get(conferenceId);
        if (participants != null) {
            for (UUID userId : participants) {
                sendToUser(userId, message);
            }
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
        conferenceParticipants.remove(conferenceId);
        voteStore.clear(conferenceId);
    }

    /**
     * 참가자 목록을 조회하는 메서드
     */
    public List<UUID> getParticipants(UUID conferenceId) {
        return conferenceParticipants.getOrDefault(conferenceId, List.of());
    }

    /**
     * 특정 사용자에게 WebSocket 메시지를 전송하는 메서드
     */
    public void sendToUser(UUID userId, Object message) {
        sessionStore.findSessionIdByUser(userId)
                .flatMap(sessionStore::find)
                .ifPresent(session -> sendMessage(session, message));
    }

    /**
     * WebSocket 메시지를 전송하는 메서드
     */
    private void sendMessage(WebSocketSession session, Object message) {
        if (!session.isOpen()) {
            return;
        }

        try {
            synchronized (session) {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
                }
            }

        } catch (Exception e) {
            log.warn("WebSocket 메시지 전송 실패. sessionId={}", session.getId(), e);
        }
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
