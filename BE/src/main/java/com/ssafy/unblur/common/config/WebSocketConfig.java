package com.ssafy.unblur.common.config;

import com.ssafy.unblur.domain.rtc.signaling.KurentoWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * WebSocket 설정 클래스
 */
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final KurentoWebSocketHandler kurentoWebSocketHandler;

    /**
     * WebSocket 핸들러를 등록하는 메서드
     *
     * @param registry 핸들러 레지스트리
     */
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(kurentoWebSocketHandler, "/ws/rtc")
                .setAllowedOrigins("*"); // Todo: 프로덕션 환경에서는 적절한 도메인으로 변경 필요
    }
}
