package com.ssafy.unblur.domain.match.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.unblur.common.service.event.EventType;
import com.ssafy.unblur.common.service.event.SseEventType;
import com.ssafy.unblur.common.service.event.WsEventType;
import com.ssafy.unblur.domain.match.service.MatchEventPublisher;
import com.ssafy.unblur.common.service.SseService;
import com.ssafy.unblur.domain.rtc.service.RtcSessionStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.UUID;

/**
 * 매칭 이벤트 발행 구현체
 * <p>
 * 이벤트 타입에 따라 SSE 또는 WebSocket으로 라우팅한다
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MatchEventPublisherImpl implements MatchEventPublisher {

    /**
     * 매칭 SSE 서비스
     */
    private final SseService sseService;

    /**
     * RTC 세션 저장소
     */
    private final RtcSessionStore sessionStore;

    /**
     * JSON 객체 매퍼
     */
    private final ObjectMapper objectMapper;

    @Override
    public void publish(UUID userId, EventType type, Object data) {
        if (type instanceof SseEventType sseType) {
            sseService.publish(userId, sseType, data);

        } else if (type instanceof WsEventType) {
            sendWebSocketMessage(userId, data);

        } else {
            log.warn("알 수 없는 이벤트 타입: {}", type);
        }
    }

    /**
     * WebSocket 메시지를 전송하는 메서드
     *
     * @param userId 사용자 ID
     * @param data   전송 데이터
     */
    private void sendWebSocketMessage(UUID userId, Object data) {
        sessionStore.findSessionIdByUser(userId)
                .flatMap(sessionStore::find)
                .ifPresent(session -> sendMessage(session, data));
    }

    /**
     * WebSocket 세션에 메시지를 전송하는 메서드
     *
     * @param session WebSocket 세션
     * @param message 전송 메시지
     */
    private void sendMessage(WebSocketSession session, Object message) {
        if (!session.isOpen()) {
            return;
        }

        try {
            synchronized (session) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
            }

        } catch (IOException e) {
            log.error("WebSocket 메시지 전송 실패: {}", e.getMessage());
        }
    }
}
