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
    QUICK_MATCHED("quick-match-matched");

    private final String eventName;

    MatchEventType(String eventName) {
        this.eventName = eventName;
    }

    public String eventName() {
        return eventName;
    }
}
