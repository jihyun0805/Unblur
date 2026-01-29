package com.ssafy.unblur.domain.rtc.service.impl;

import com.ssafy.unblur.domain.rtc.service.RtcParticipantStore;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 인메모리 RTC 세션 참가자 저장소 구현체
 */
@Component
public class InMemoryRtcParticipantStore implements RtcParticipantStore {

    /**
     * 세션별 참가자 저장소
     * <p>
     * Key: 세션 ID, Value: 참가자 ID 집합
     */
    private final Map<UUID, Set<UUID>> participants = new ConcurrentHashMap<>();

    @Override
    public void add(UUID conferenceId, UUID userId) {
        participants.computeIfAbsent(conferenceId, k -> ConcurrentHashMap.newKeySet())
                .add(userId);
    }

    @Override
    public void remove(UUID conferenceId, UUID userId) {
        Set<UUID> userIds = participants.get(conferenceId);
        if (userIds != null) {
            userIds.remove(userId);

            if (userIds.isEmpty()) {
                participants.remove(conferenceId);
            }
        }
    }

    @Override
    public List<UUID> getParticipantIds(UUID conferenceId) {
        Set<UUID> userIds = participants.get(conferenceId);
        if (userIds == null) {
            return List.of();
        }

        return List.copyOf(userIds);
    }

    @Override
    public void clear(UUID conferenceId) {
        participants.remove(conferenceId);
    }

}
