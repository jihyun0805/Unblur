package com.ssafy.unblur.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

/**
 * 애플리케이션 기준 시각 설정 클래스
 */
@Configuration
public class ClockConfig {

    /**
     * 기본 기준 시각 제공
     *
     * @return Clock
     */
    @Bean
    public Clock clock() {
        return Clock.system(ZoneId.of("Asia/Seoul"));
    }
}
