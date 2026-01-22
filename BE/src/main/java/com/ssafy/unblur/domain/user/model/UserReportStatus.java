package com.ssafy.unblur.domain.user.model;

/**
 * 사용자 신고 처리 상태.
 */
public enum UserReportStatus {
    /** 접수됨 */
    pending,
    /** 검토 중 */
    reviewing,
    /** 처리 완료 */
    resolved,
    /** 반려 */
    rejected
}
