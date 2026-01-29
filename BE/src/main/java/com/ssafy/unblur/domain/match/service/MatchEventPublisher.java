package com.ssafy.unblur.domain.match.service;

import com.ssafy.unblur.common.service.event.EventType;

import java.util.UUID;

/**
 * 매칭 이벤트 발행 인터페이스
 * <p>
 * 이벤트 타입에 따라 SSE 또는 WebSocket으로 전송한다
 */
public interface MatchEventPublisher {

    /**
     * 이벤트를 발행하는 메서드
     *
     * @param userId 사용자 ID
     * @param type   이벤트 타입
     * @param data   전송 데이터
     */
    void publish(UUID userId, EventType type, Object data);
}
