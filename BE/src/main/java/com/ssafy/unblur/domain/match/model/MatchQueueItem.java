package com.ssafy.unblur.domain.match.model;

import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * 인메모리 매칭 대기열 항목을 나타내는 클래스
 * <p>
 * 빠른 매칭은 요청자만 존재하며, 1:1 매칭은 요청자/수신자를 함께 담는다</p>
 */
@Data
@Builder
@AllArgsConstructor
public class MatchQueueItem {

    /**
     * 대기열 요청 ID
     */
    private final UUID requestId;

    /**
     * 요청자 사용자 ID
     */
    private final UUID requesterUserId;

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
    @Builder.Default
    private MatchQueueStatus status = MatchQueueStatus.WAITING;

    /**
     * 1:1 매칭 요청 수신자 사용자 ID
     */
    private final UUID recipientUserId;

    /**
     * 매칭된 시각
     */
    private LocalDateTime matchedAt;

    /**
     * 매칭 완료 처리하는 메서드
     *
     * @param matchedAt 매칭된 시각
     */
    public void markMatched(LocalDateTime matchedAt) {
        this.status = MatchQueueStatus.MATCHED;
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
