package com.ssafy.unblur.common.service;

import com.ssafy.unblur.common.service.event.SseEventType;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Set;
import java.util.UUID;

/**
 * 매칭 SSE 서비스 인터페이스
 */
public interface SseService {

    /**
     * SSE 연결을 생성하는 메서드
     *
     * @param userId 사용자 ID
     * @return SSE emitter
     */
    SseEmitter connect(UUID userId);

    /**
     * 매칭 이벤트를 전송하는 메서드
     *
     * @param userId 사용자 ID
     * @param type   이벤트 유형
     * @param data   전송 데이터
     */
    void publish(UUID userId, SseEventType type, Object data);

    /**
     * 현재 SSE 연결된 사용자 ID 목록을 반환하는 메서드
     *
     * @return 연결된 사용자 ID Set
     */
    Set<UUID> getConnectedUserIds();

    /**
     * 특정 사용자가 SSE에 연결되어 있는지 확인하는 메서드
     *
     * @param userId 사용자 ID
     */
    boolean isUserConnected(UUID userId);

}
