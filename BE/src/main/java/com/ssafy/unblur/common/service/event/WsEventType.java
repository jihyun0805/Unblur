package com.ssafy.unblur.common.service.event;

/**
 * WebSocket 이벤트 유형
 */
public enum WsEventType implements EventType {

    // 라운드 관련
    ROUND_TIME_UP("round-time-up"),
    VOTE_CONFIRM_REQUEST("vote-confirm-request"),
    VOTE_WAITING_CONFIRM("vote-waiting-confirm"),
    ROUND_STARTED("round-started"),
    ROUND_ENDED("round-ended"),
    CONFERENCE_ENDED("conference-ended"),

    // 시그널링 관련
    REGISTERED("registered"),
    JOINED("joined"),
    ANSWER("answer"),
    CANDIDATE("candidate"),
    LEFT("left"),
    VOTE_RECEIVED("vote-received"),
    ERROR("error");

    private final String eventName;

    WsEventType(String eventName) {
        this.eventName = eventName;
    }

    public String eventName() {
        return eventName;
    }
}
