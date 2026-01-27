package com.ssafy.unblur.domain.rtc.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Kurento 클라이언트 설정 클래스
 * <p>
 * KurentoClient는 연결 재생성 이슈가 있어 Provider 패턴으로 관리한다.
 */
@Configuration
public class KurentoConfig {

    @Value("${kurento.ws.uri:ws://localhost:8888/kurento}")
    private String kurentoWsUri;

    /**
     * Kurento 클라이언트 제공자를 생성하는 메서드
     *
     * @return Kurento 클라이언트 제공자
     */
    @Bean
    public KurentoClientProvider kurentoClientProvider() {
        return new KurentoClientProvider(kurentoWsUri);
    }
}
