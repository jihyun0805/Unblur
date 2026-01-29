package com.ssafy.unblur.domain.rtc.model;

import org.kurento.client.WebRtcEndpoint;

import java.util.UUID;

/**
 * 사용자별 WebRTC 세션 정보를 담는 클래스
 */
public record UserSession(UUID userId, WebRtcEndpoint webRtcEndpoint) {
}
