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
    ROUND_SKIP_REQUESTED("round-skip-requested"),
    ROUND_SKIP_SENT("round-skip-sent"),
    ROUND_SKIPPED("round-skipped"),
    ROUND_SKIP_DECLINED("round-skip-declined"),

    // 밸런스 게임
    BALANCE_INVITE("balance-invite"),
    BALANCE_DECLINED("balance-declined"),
    BALANCE_STARTED("balance-start"),
    BALANCE_SELECTED("balance-selected"),
    BALANCE_RESULT("balance-result"),

    // 미디어 상태 (카메라/마이크 켜짐·꺼짐을 상대에게 알림)
    MEDIA_STATE("media-state"),

    // 시그널링 관련
    REGISTERED("registered"),
    JOINED("joined"),
    ANSWER("answer"),
    CANDIDATE("candidate"),
    LEFT("left"),
    PARTNER_VOTED("partner-voted"),
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
