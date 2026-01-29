package com.ssafy.unblur.common.service.event;

/**
 * SSE 매칭 이벤트 유형
 */
public enum SseEventType implements EventType {

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
     * 1:1 매칭 요청 수신
     */
    ONE_ON_ONE_REQUESTED("one-on-one-requested"),

    /**
     * 1:1 매칭 수락됨
     */
    ONE_ON_ONE_ACCEPTED("one-on-one-accepted"),

    /**
     * 1:1 매칭 거절됨
     */
    ONE_ON_ONE_DECLINED("one-on-one-declined"),

    /**
     * 1:1 매칭 취소됨
     */
    ONE_ON_ONE_CANCELED("one-on-one-canceled"),

    /**
     * 1:1 매칭 타임아웃
     */
    ONE_ON_ONE_TIMEOUT("one-on-one-timeout");

    private final String eventName;

    SseEventType(String eventName) {
        this.eventName = eventName;
    }

    public String eventName() {
        return eventName;
    }
}
