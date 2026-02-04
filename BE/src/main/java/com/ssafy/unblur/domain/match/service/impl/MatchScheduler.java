package com.ssafy.unblur.domain.match.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 매칭 대기열 스케줄러
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MatchScheduler {

    private final MatchQueueProcessor queueProcessor;

    /**
     * 대기열을 주기적으로 처리하는 메서드
     */
    @Scheduled(fixedDelayString = "${match.queue.process-interval-ms:1000}")
    public void processQueue() {
        log.debug("매칭 대기열 스케줄러 실행");
        queueProcessor.processQueue();
    }
}
