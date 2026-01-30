package com.ssafy.unblur.common.service.impl;

import com.ssafy.unblur.common.service.event.SseEventType;
import com.ssafy.unblur.common.service.SseService;
import org.springframework.stereotype.Service;
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
        }

        SseEmitter emitter = new SseEmitter(0L);
        emitters.put(userId, emitter);

        emitter.onCompletion(() -> emitters.remove(userId));
        emitter.onTimeout(() -> emitters.remove(userId));
        emitter.onError(error -> emitters.remove(userId));

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
            return;
        }

        try {
            emitter.send(SseEmitter.event().name(name).data(data));

        } catch (IOException ex) {
            emitters.remove(userId);
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
}
