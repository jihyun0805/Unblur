package com.ssafy.unblur.domain.rtc.service;

import org.springframework.web.socket.WebSocketSession;

import java.util.Optional;
import java.util.UUID;

/**
 * WebSocket 세션 저장소 인터페이스
 */
public interface RtcSessionStore {

    /**
     * 세션을 등록하는 메서드
     *
     * @param session WebSocket 세션
     */
    void register(WebSocketSession session);

    /**
     * 세션과 사용자 ID를 연결하는 메서드
     *
     * @param sessionId 세션 ID
     * @param userId    사용자 ID
     */
    void bindUser(String sessionId, UUID userId);

    /**
     * 세션을 제거하는 메서드
     *
     * @param sessionId 세션 ID
     */
    void remove(String sessionId);

    /**
     * 세션을 조회하는 메서드
     *
     * @param sessionId 세션 ID
     * @return WebSocket 세션
     */
    Optional<WebSocketSession> find(String sessionId);

    /**
     * 사용자 ID로 세션 ID를 조회하는 메서드
     *
     * @param userId 사용자 ID
     * @return 세션 ID
     */
    Optional<String> findSessionIdByUser(UUID userId);

    /**
     * 세션과 회의 ID를 연결하는 메서드
     *
     * @param sessionId    세션 ID
     * @param conferenceId 회의 ID
     */
    void bindConference(String sessionId, UUID conferenceId);

    /**
     * 세션 ID로 회의 ID를 조회하는 메서드
     *
     * @param sessionId 세션 ID
     * @return 회의 ID
     */
    Optional<UUID> getConferenceId(String sessionId);

    /**
     * 세션 ID로 사용자 ID를 조회하는 메서드
     *
     * @param sessionId 세션 ID
     * @return 사용자 ID
     */
    Optional<UUID> getUserId(String sessionId);
}
