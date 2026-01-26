package com.ssafy.unblur.domain.match.service;

import com.ssafy.unblur.domain.match.dto.FastMatchingRequest;
import com.ssafy.unblur.domain.match.dto.MatchingQueueResponse;

import java.util.UUID;

/**
 * 매칭 서비스 인터페이스
 */
public interface MatchService {

    /**
     * 빠른 매칭 요청 처리하는 메서드
     *
     * @param userId  사용자 ID
     * @param request 요청 DTO
     * @return 대기열 상태
     */
    MatchingQueueResponse startQuickMatch(UUID userId, FastMatchingRequest request);

}
