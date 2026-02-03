package com.ssafy.unblur.common.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket 메시지 전송 유틸리티
 * <p>
 * 세션별 락을 통해 동시 전송 충돌을 방지한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketMessageSender {

    /**
     * 객체 매퍼
     */
    private final ObjectMapper objectMapper;

    /**
     * 세션별 전송 락 저장소
     */
    private final Map<String, Object> sessionLocks = new ConcurrentHashMap<>();

    /**
     * WebSocket 메시지를 전송하는 메서드
     *
     * @param session WebSocket 세션
     * @param message 전송할 메시지 객체
     * @throws IOException 전송 중 IO 예외 발생 시
     */
    public void send(WebSocketSession session, Object message) throws IOException {
        if (session == null || !session.isOpen()) {
            return;
        }

        // 세션별 락을 사용하여 동시 전송 충돌 방지
        Object lock = sessionLocks.computeIfAbsent(session.getId(), id -> new Object());
        synchronized (lock) {
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
            }
        }
    }

    /**
     * 세션 전송 락을 해제하는 메서드
     *
     * @param sessionId WebSocket 세션 ID
     */
    public void release(String sessionId) {
        if (sessionId == null) {
            return;
        }

        sessionLocks.remove(sessionId);
    }
}
