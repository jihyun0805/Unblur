package com.ssafy.unblur.domain.match.model;

/**
 * 매칭 대기열 상태
 */
public enum MatchQueueStatus {

    /**
     * 대기
     */
    WAITING,

    /**
     * 매칭 완료
     */
    MATCHED,

    /**
     * 취소
     */
    CANCELED,

    /**
     * 타임아웃
     */
    TIMEOUT
}
