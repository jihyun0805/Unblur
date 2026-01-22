package com.ssafy.unblur.domain.rtc.model;

import lombok.Data;
import org.kurento.client.WebRtcEndpoint;
import org.springframework.web.socket.WebSocketSession;

import java.util.UUID;

/**
 * 사용자별 WebRTC 세션 정보를 담는 클래스
 */
@Data
public class UserSession {
    private final UUID userId;
    private final WebSocketSession session;
    private final WebRtcEndpoint webRtcEndpoint;
}
