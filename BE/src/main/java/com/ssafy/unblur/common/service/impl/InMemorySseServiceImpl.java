package com.ssafy.unblur.common.service.impl;

import com.ssafy.unblur.common.service.SseService;
import com.ssafy.unblur.common.service.event.SseEventType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 매칭 SSE 알림 전송 서비스 구현체
 * <p>
 * 단일 인스턴스 환경을 가정한 인메모리 저장 방식이다
 */
@Slf4j
@Service
public class InMemorySseServiceImpl implements SseService {

    /**
     * 사용자별 SSE 연결 저장소
     */
    private final Map<UUID, SseEmitter> emitters = new ConcurrentHashMap<>();

    @Override
    public SseEmitter connect(UUID userId) {
        // 기존 연결 정리
        SseEmitter existingEmitter = emitters.remove(userId);
        if (existingEmitter != null) {
            existingEmitter.complete();
            log.info("SSE 기존 연결 종료. userId={}", userId);
        }

        SseEmitter emitter = new SseEmitter(0L);
        emitters.put(userId, emitter);
        log.info("SSE 연결 생성. userId={}, total={}", userId, emitters.size());

        // 연결 종료 시 저장소에서 제거 (동일 사용자 재연결로 새 emitter 생성 시 새 emitter 유지)
        emitter.onCompletion(() -> {
            emitters.remove(userId, emitter);
            log.info("SSE 연결 종료(completion). userId={}, total={}", userId, emitters.size());
        });
        emitter.onTimeout(() -> {
            emitters.remove(userId, emitter);
            log.warn("SSE 연결 종료(timeout). userId={}, total={}", userId, emitters.size());
        });
        emitter.onError(error -> {
            emitters.remove(userId, emitter);
            log.warn("SSE 연결 오류. userId={}, error={}", userId, error.toString());
        });

        return emitter;
    }

    @Override
    public void publish(UUID userId, SseEventType type, Object data) {
        send(userId, type.eventName(), data);
    }

    /**
     * SSE 이벤트를 전송하는 메서드
     *
     * @param userId 사용자 ID
     * @param name   이벤트 이름
     * @param data   전송 데이터
     */
    private void send(UUID userId, String name, Object data) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter == null) {
            log.warn("SSE 전송 실패: 연결 없음. userId={}, event={}", userId, name);
            return;
        }

        try {
            emitter.send(SseEmitter.event().name(name).data(data));
            log.debug("SSE 전송 성공. userId={}, event={}", userId, name);

        } catch (IOException ex) {
            emitters.remove(userId, emitter);
            log.warn("SSE 전송 실패: 예외 발생. userId={}, event={}, error={}", userId, name, ex.toString());
        }
    }

    @Override
    public Set<UUID> getConnectedUserIds() {
        return Set.copyOf(emitters.keySet());
    }

    @Override
    public boolean isUserConnected(UUID userId) {
        return emitters.containsKey(userId);
    }

    @Override
    public void disconnect(UUID userId) {
        SseEmitter emitter = emitters.remove(userId);
        if (emitter != null) {
            emitter.complete();
            log.info("SSE 연결 종료(disconnect). userId={}, total={}", userId, emitters.size());
        }
    }

    /**
     * 연결 유지를 위한 하트비트 전송하는 스케줄러
     */
    @Scheduled(fixedRateString = "${sse.heartbeat-interval-ms:15000}")
    public void heartbeat() {
        if (emitters.isEmpty()) {
            return;
        }

        // 모든 연결에 하트비트 전송
        emitters.forEach((userId, emitter) -> {
            try {
                emitter.send(SseEmitter.event().name("ping").data("ok"));

            } catch (IOException ex) {
                emitters.remove(userId, emitter);
                log.warn("SSE 하트비트 실패. userId={}, error={}", userId, ex.toString());
            }
        });
    }
}
