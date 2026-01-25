package com.ssafy.unblur.domain.match.model;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * 인메모리 매칭 대기열 항목을 나타내는 클래스
 */
@Data
public class MatchQueueItem {

    /**
     * 대기열 요청 ID
     */
    private final UUID requestId;

    /**
     * 요청 사용자 ID
     */
    private final UUID userId;

    /**
     * 매칭 유형
     */
    private final MatchQueueType queueType;

    /**
     * 요청 생성 시각
     */
    private final LocalDateTime createdAt;

    /**
     * 요청 필터 원본
     */
    private final Map<String, Object> filters;

    /**
     * 대기열 상태
     */
    private MatchQueueStatus status;

    /**
     * 매칭된 상대 사용자 ID
     */
    private UUID matchedUserId;

    /**
     * 매칭된 시각
     */
    private LocalDateTime matchedAt;

    /**
     * 매칭 완료 처리하는 메서드
     *
     * @param matchedUserId 상대 사용자 ID
     * @param matchedAt     매칭된 시각
     */
    public void markMatched(UUID matchedUserId, LocalDateTime matchedAt) {
        this.status = MatchQueueStatus.MATCHED;
        this.matchedUserId = matchedUserId;
        this.matchedAt = matchedAt;
    }

    /**
     * 취소 처리하는 메서드
     */
    public void markCanceled() {
        this.status = MatchQueueStatus.CANCELED;
    }

    /**
     * 타임아웃 처리하는 메서드
     */
    public void markTimeout() {
        this.status = MatchQueueStatus.TIMEOUT;
    }

    /**
     * 대기 상태 여부 확인하는 메서드
     *
     * @return 대기 중이면 true
     */
    public boolean isWaiting() {
        return this.status == MatchQueueStatus.WAITING;
    }
}
