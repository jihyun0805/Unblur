package com.ssafy.unblur.domain.rtc.service;

import com.fasterxml.jackson.databind.node.ObjectNode;

import org.springframework.web.socket.WebSocketSession;

/**
 * RTC 메시지 전송 인터페이스
 */
public interface RtcMessageSender {

    /**
     * 세션 ID 기준으로 메시지를 전송하는 메서드
     *
     * @param sessionId 세션 ID
     * @param message   전송 메시지
     */
    void send(String sessionId, ObjectNode message);

    /**
     * 세션 객체 기준으로 메시지를 전송하는 메서드
     *
     * @param session WebSocket 세션
     * @param message 전송 메시지
     */
    void send(WebSocketSession session, ObjectNode message);

}
