package com.ssafy.unblur.domain.match.model;

/**
 * 투표 진행 상태
 */
public enum VoteState {

    /**
     * 라운드 진행 중
     */
    IN_PROGRESS,

    /**
     * 투표 대기 중 (아무도 투표 안함)
     */
    WAITING,

    /**
     * 한 명 투표 완료, 상대방 대기
     */
    PENDING,

    /**
     * 둘 다 투표 완료
     */
    COMPLETED,

    /**
     * 재확인 대기 중 (의견 불일치로 거절자에게 재확인 요청)
     */
    CONFIRMING
}
