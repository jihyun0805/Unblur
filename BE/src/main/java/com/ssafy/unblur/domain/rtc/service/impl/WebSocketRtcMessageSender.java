package com.ssafy.unblur.domain.rtc.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ssafy.unblur.domain.rtc.service.RtcMessageSender;
import com.ssafy.unblur.domain.rtc.service.RtcSessionStore;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

/**
 * WebSocket 기반 RTC 메시지 전송 구현체
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketRtcMessageSender implements RtcMessageSender {

    /**
     * 세션 ID로 WebSocketSession을 조회하는 저장소
     */
    private final RtcSessionStore sessionStore;

    /**
     * 메시지 payload를 JSON 문자열로 직렬화하는 매퍼
     */
    private final ObjectMapper objectMapper;

    /**
     * 세션 attributes에 저장하는 전송 락 키
     * </p>
     * 세션 생명주기와 함께 정리되도록 session.getAttributes()를 사용한다
     */
    private static final String SEND_LOCK_KEY = WebSocketRtcMessageSender.class.getName() + ".sendLock";

    @Override
    public void send(String sessionId, ObjectNode message) {
        sessionStore.find(sessionId).ifPresent(session -> send(session, message));
    }

    @Override
    public void send(WebSocketSession session, ObjectNode message) {
        Object lock = session.getAttributes().computeIfAbsent(SEND_LOCK_KEY, key -> new Object());

        synchronized (lock) {
            if (!session.isOpen()) {
                return;
            }

            try {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
            } catch (Exception ex) {
                log.warn("WebSocket 메시지 전송 실패", ex);
            }
        }
    }

}
