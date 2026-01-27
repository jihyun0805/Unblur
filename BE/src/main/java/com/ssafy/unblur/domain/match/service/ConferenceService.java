package com.ssafy.unblur.domain.match.service;

import com.ssafy.unblur.domain.match.dto.AdvanceRoundResponse;

import java.util.UUID;

/**
 * 세션(컨퍼런스) 라운드 관리 서비스 인터페이스
 */
public interface ConferenceService {

    /**
     * 다음 라운드로 진행하거나 세션을 종료하는 메서드
     *
     * @param conferenceId 세션 ID
     * @param userId       요청자 사용자 ID
     * @param proceed      다음 라운드 진행 여부 (false면 세션 종료)
     * @return 라운드 전환 결과
     */
    AdvanceRoundResponse advanceRound(UUID conferenceId, UUID userId, boolean proceed);
}
