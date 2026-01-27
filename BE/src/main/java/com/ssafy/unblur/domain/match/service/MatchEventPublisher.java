package com.ssafy.unblur.domain.match.service;

import com.ssafy.unblur.domain.match.model.MatchEventType;

import java.util.UUID;

/**
 * 매칭 상태 알림 전송 인터페이스
 */
public interface MatchEventPublisher {

    /**
     * 매칭 이벤트를 전송하는 메서드
     *
     * @param userId 사용자 ID
     * @param type   이벤트 유형
     * @param data   전송 데이터
     */
    void publish(UUID userId, MatchEventType type, Object data);
}
