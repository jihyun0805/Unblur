package com.ssafy.unblur.domain.rtc.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

/**
 * WebSocket 메시지 기본 클래스
 */
@Getter
@SuperBuilder
@JsonInclude(JsonInclude.Include.NON_NULL)
public abstract class WebSocketMessage {

    private final String type;

    protected WebSocketMessage(String type) {
        this.type = type;
    }
}
