package com.ssafy.unblur.domain.match.model;

/**
 * 소개팅 세션 상태.
 */
public enum ConferenceStatus {
    /** 대기 */
    waiting,
    /** 진행 중 */
    active,
    /** 완료 */
    completed,
    /** 취소 */
    cancelled
}
