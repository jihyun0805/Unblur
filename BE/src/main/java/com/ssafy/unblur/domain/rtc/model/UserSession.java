package com.ssafy.unblur.domain.rtc.model;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kurento.client.WebRtcEndpoint;
import org.springframework.web.socket.WebSocketSession;

import java.util.UUID;

/**
 * 사용자별 WebRTC 세션 정보를 담는 클래스
 */
@Slf4j
public record UserSession(UUID userId, WebSocketSession session, WebRtcEndpoint webRtcEndpoint) {

    /**
     * 유저 세션 종료 시 WebRtcEndpoint 자원 해제하는 메서드
     */
    public void close() {
        try {
            if (webRtcEndpoint != null) {
                webRtcEndpoint.release();
            }

        } catch (Exception e) {
            log.warn("사용자 {} 의 WebRtcEndpoint 자원 해제 중 오류 발생: {}", userId, e.getMessage());
        }
    }
}
