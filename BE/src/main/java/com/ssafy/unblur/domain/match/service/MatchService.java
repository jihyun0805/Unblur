package com.ssafy.unblur.domain.match.service;

import com.ssafy.unblur.domain.match.dto.request.FastMatchingRequest;
import com.ssafy.unblur.domain.auth.model.LoveDna;
import com.ssafy.unblur.domain.match.dto.request.OneOnOneMatchRequest;
import com.ssafy.unblur.domain.match.dto.response.MatchingQueueResponse;
import com.ssafy.unblur.domain.match.dto.response.OneOnOneMatchResponse;
import com.ssafy.unblur.domain.match.dto.response.OneOnOneMatchedResponse;
import com.ssafy.unblur.domain.match.dto.response.OnlineUserListResponse;

import java.util.UUID;

/**
 * 매칭 서비스 인터페이스
 */
public interface MatchService {

    /**
     * 빠른 매칭 요청을 대기열에 등록하고 즉시 매칭을 시도하는 메서드
     *
     * @param userId  사용자 ID
     * @param request 요청 DTO
     * @return 대기열 상태
     */
    MatchingQueueResponse startQuickMatch(UUID userId, FastMatchingRequest request);

    /**
     * 빠른 매칭을 취소하는 메서드
     *
     * @param userId    사용자 ID
     * @param requestId 매칭 요청 ID
     */
    void cancelQuickMatch(UUID userId, String requestId);

    /**
     * 매칭 대기 상태를 조회하는 메서드
     *
     * @param userId 사용자 ID
     * @return 대기열 상태 (대기 중인 요청이 없으면 null)
     */
    MatchingQueueResponse getQueueStatus(UUID userId);

    /**
     * 1:1 매칭 요청을 처리하는 메서드
     *
     * @param userId  요청자 사용자 ID
     * @param request 1:1 매칭 요청 DTO
     * @return 1:1 매칭 응답
     */
    OneOnOneMatchResponse startOneOnOneMatch(UUID userId, OneOnOneMatchRequest request);

    /**
     * 1:1 매칭 요청을 수락하는 메서드
     *
     * @param userId    수신자 사용자 ID
     * @param requestId 매칭 요청 ID
     * @return 1:1 매칭 완료 응답
     */
    OneOnOneMatchedResponse acceptOneOnOneMatch(UUID userId, String requestId);

    /**
     * 1:1 매칭 요청을 거절하는 메서드
     *
     * @param userId    수신자 사용자 ID
     * @param requestId 매칭 요청 ID
     * @return 1:1 매칭 응답
     */
    OneOnOneMatchResponse declineOneOnOneMatch(UUID userId, String requestId);

    /**
     * 1:1 매칭 요청을 취소하는 메서드
     *
     * @param userId 요청자 사용자 ID
     * @return 1:1 매칭 응답
     */
    OneOnOneMatchResponse cancelOneOnOneMatch(UUID userId);

    /**
     * 현재 온라인인 사용자 중 반대 성별인 랜덤 사용자 목록을 반환하는 메서드
     *
     * @param userId 요청 사용자 ID
     * @param limit  최대 반환 개수
     * @return 온라인 사용자 목록
     */
    OnlineUserListResponse getRandomOnlineUsers(UUID userId, int limit, LoveDna loveDna);

}
