package com.ssafy.unblur.domain.match.service;

import com.ssafy.unblur.domain.match.model.MatchQueueItem;
import com.ssafy.unblur.domain.match.model.MatchQueueType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 매칭 대기열 저장소 인터페이스
 */
public interface MatchQueueStore {

    /**
     * 대기열 항목을 등록하는 메서드
     *
     * @param item 대기열 항목
     * @return 등록된 대기열 항목
     */
    MatchQueueItem save(MatchQueueItem item);

    /**
     * 요청 ID로 대기열 항목을 조회하는 메서드
     *
     * @param requestId 요청 ID
     * @return 대기열 항목
     */
    Optional<MatchQueueItem> findByRequestId(UUID requestId);

    /**
     * 사용자 ID로 대기열 항목을 조회하는 메서드
     *
     * @param userId    요청자 사용자 ID
     * @param queueType 대기열 유형
     * @return 대기열 항목
     */
    Optional<MatchQueueItem> findByUserId(UUID userId, MatchQueueType queueType);

    /**
     * 대기 중인 항목 목록을 조회하는 메서드
     *
     * @param queueType 대기열 유형
     * @return 대기열 목록
     */
    List<MatchQueueItem> findWaitingByType(MatchQueueType queueType);

    /**
     * 사용자 대기 여부를 확인하는 메서드
     *
     * @param userId    요청자 사용자 ID
     * @param queueType 대기열 유형
     * @return 대기 중이면 true
     */
    boolean existsWaiting(UUID userId, MatchQueueType queueType);

    /**
     * 완료/취소/타임아웃 등 종료 상태의 항목을 정리하는 메서드
     *
     * @param cutoff 정리 기준 시각
     */
    void purgeFinished(LocalDateTime cutoff);

}
