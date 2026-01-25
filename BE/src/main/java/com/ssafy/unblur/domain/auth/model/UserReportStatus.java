package com.ssafy.unblur.domain.auth.model;

/**
 * 사용자 신고 처리 상태.
 */
public enum UserReportStatus {
    /** 접수됨 */
    PENDING,
    /** 검토 중 */
    REVIEWING,
    /** 처리 완료 */
    RESOLVED,
    /** 반려 */
    REJECTED
}
