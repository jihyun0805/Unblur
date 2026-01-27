package com.ssafy.unblur.domain.match.model;

/**
 * 매칭 이벤트 유형
 */
public enum MatchEventType {

    /**
     * 빠른 매칭 대기 등록
     */
    QUICK_WAITING("quick-match-waiting"),

    /**
     * 빠른 매칭 완화 단계 진입
     */
    QUICK_RELAXED("quick-match-relaxed"),

    /**
     * 빠른 매칭 완료
     */
    QUICK_MATCHED("quick-match-matched"),

    /**
     * 빠른 매칭 타임아웃
     */
    QUICK_TIMEOUT("quick-match-timeout"),

    /**
     * 빠른 매칭 취소
     */
    QUICK_CANCELED("quick-match-canceled"),

    /**
     * 라운드 종료 알림
     */
    ROUND_ENDED("round-ended");

    private final String eventName;

    MatchEventType(String eventName) {
        this.eventName = eventName;
    }

    public String eventName() {
        return eventName;
    }
}
