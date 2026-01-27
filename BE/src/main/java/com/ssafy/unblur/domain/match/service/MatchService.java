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

    /**
     * 빠른 매칭 취소 요청 처리하는 메서드
     *
     * @param userId    사용자 ID
     * @param requestId 매칭 요청 ID
     */
    void cancelQuickMatch(UUID userId, String requestId);

    /**
     * 매칭 대기 상태 조회하는 메서드
     *
     * @param userId 사용자 ID
     * @return 대기열 상태 (대기 중인 요청이 없으면 null)
     */
    MatchingQueueResponse getQueueStatus(UUID userId);

}
