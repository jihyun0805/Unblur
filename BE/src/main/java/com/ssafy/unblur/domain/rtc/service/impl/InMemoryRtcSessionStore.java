package com.ssafy.unblur.domain.rtc.service.impl;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import com.ssafy.unblur.domain.rtc.service.RtcSessionStore;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

/**
 * 인메모리 기반 WebSocket 세션 저장소 구현체.
 */
@Component
@SuppressWarnings("resource")
public class InMemoryRtcSessionStore implements RtcSessionStore {

    /**
     * 세션 ID를 키로 WebSocketSession을 저장하는 맵
     */
    private final ConcurrentMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>(); // WebSocketSession은 컨테이너가 생명주기를 관리하므로 try-with-resources 적용 대상이 아님

    /**
     * 사용자 ID를 키로 세션 ID를 저장하는 맵
     */
    private final ConcurrentMap<UUID, String> userSessions = new ConcurrentHashMap<>();

    /**
     * 세션 ID를 키로 사용자 ID를 저장하는 맵
     */
    private final ConcurrentMap<String, UUID> sessionUsers = new ConcurrentHashMap<>();

    @Override
    public void register(WebSocketSession session) {
        sessions.put(session.getId(), session);
    }

    @Override
    public void bindUser(String sessionId, UUID userId) {
        if (userId == null || sessionId == null) {
            return;
        }

        String previousSessionId = userSessions.put(userId, sessionId);
        sessionUsers.put(sessionId, userId);

        if (previousSessionId != null && !previousSessionId.equals(sessionId)) {
            sessionUsers.remove(previousSessionId);
        }
    }

    @Override
    public void remove(String sessionId) {
        sessions.remove(sessionId);
        UUID userId = sessionUsers.remove(sessionId);

        if (userId != null) {
            userSessions.remove(userId, sessionId);
        }
    }

    @Override
    public Optional<WebSocketSession> find(String sessionId) {
        return Optional.ofNullable(sessions.get(sessionId));
    }

    @Override
    public Optional<String> findSessionIdByUser(UUID userId) {
        return Optional.ofNullable(userSessions.get(userId));
    }

}
