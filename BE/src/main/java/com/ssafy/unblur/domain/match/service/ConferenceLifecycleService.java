package com.ssafy.unblur.domain.match.service;

import java.util.UUID;

/**
 * 세션 라이프사이클(입장/퇴장)을 기록하는 서비스
 */
public interface ConferenceLifecycleService {

    /**
     * 사용자가 세션에 입장했음을 기록하는 메서드
     *
     * @param conferenceId 세션 ID
     * @param userId       사용자 ID
     */
    void onJoin(UUID conferenceId, UUID userId);

    /**
     * 사용자가 세션에서 퇴장했음을 기록하는 메서드
     *
     * @param conferenceId 세션 ID
     * @param userId       사용자 ID
     */
    void onLeave(UUID conferenceId, UUID userId);
}
