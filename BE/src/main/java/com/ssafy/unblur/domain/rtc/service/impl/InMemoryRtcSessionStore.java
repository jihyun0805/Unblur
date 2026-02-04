package com.ssafy.unblur.domain.rtc.service.impl;

import com.ssafy.unblur.domain.rtc.service.RtcSessionStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * 인메모리 기반 WebSocket 세션 저장소 구현체
 */
@Slf4j
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

    /**
     * 세션 ID를 키로 회의 ID를 저장하는 맵
     */
    private final ConcurrentMap<String, UUID> sessionConferences = new ConcurrentHashMap<>();

    @Override
    public void register(WebSocketSession session) {
        sessions.put(session.getId(), session);
        log.debug("RTC 세션 등록. sessionId={}, totalSessions={}", session.getId(), sessions.size());
    }

    @Override
    public void bindUser(String sessionId, UUID userId) {
        if (userId == null || sessionId == null) {
            return;
        }

        // 이전에 연결된 세션이 있다면 제거하고 새로운 세션으로 바꿈
        String previousSessionId = userSessions.put(userId, sessionId);
        sessionUsers.put(sessionId, userId);

        // 이전 세션이 있다면 해당 세션과의 연결을 끊음
        if (previousSessionId != null && !previousSessionId.equals(sessionId)) {
            sessionUsers.remove(previousSessionId);
            log.debug("RTC 이전 세션 언바인딩. userId={}, previousSessionId={}", userId, previousSessionId);
        }

        log.debug("RTC 세션-사용자 바인딩. sessionId={}, userId={}", sessionId, userId);
    }

    @Override
    public void remove(String sessionId) {
        // 세션 제거
        sessions.remove(sessionId);

        // 사용자 세션 매핑 제거
        UUID userId = sessionUsers.remove(sessionId);
        if (userId != null) {
            userSessions.remove(userId, sessionId);
        }

        // 회의 세션 매핑 제거
        sessionConferences.remove(sessionId);
        log.debug("RTC 세션 제거. sessionId={}, remainingSessions={}", sessionId, sessions.size());
    }

    @Override
    public Optional<WebSocketSession> find(String sessionId) {
        return Optional.ofNullable(sessions.get(sessionId));
    }

    @Override
    public Optional<String> findSessionIdByUser(UUID userId) {
        return Optional.ofNullable(userSessions.get(userId));
    }

    @Override
    public void bindConference(String sessionId, UUID conferenceId) {
        if (sessionId == null || conferenceId == null) {
            return;
        }

        sessionConferences.put(sessionId, conferenceId);
        log.debug("RTC 세션-컨퍼런스 바인딩. sessionId={}, conferenceId={}", sessionId, conferenceId);
    }

    @Override
    public Optional<UUID> getConferenceId(String sessionId) {
        return Optional.ofNullable(sessionConferences.get(sessionId));
    }

    @Override
    public Optional<UUID> getUserId(String sessionId) {
        return Optional.ofNullable(sessionUsers.get(sessionId));
    }

}
