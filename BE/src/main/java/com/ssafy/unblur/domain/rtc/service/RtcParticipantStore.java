package com.ssafy.unblur.domain.rtc.service;

import java.util.List;
import java.util.UUID;

/**
 * RTC 세션 참가자 저장소 인터페이스
 */
public interface RtcParticipantStore {

    /**
     * 참가자를 등록하는 메서드
     *
     * @param conferenceId 세션 ID
     * @param userId       사용자 ID
     */
    void add(UUID conferenceId, UUID userId);

    /**
     * 참가자를 제거하는 메서드
     *
     * @param conferenceId 세션 ID
     * @param userId       사용자 ID
     */
    void remove(UUID conferenceId, UUID userId);

    /**
     * 참가자 ID 목록을 조회하는 메서드
     *
     * @param conferenceId 세션 ID
     * @return 참가자 ID 목록
     */
    List<UUID> getParticipantIds(UUID conferenceId);

    /**
     * 세션 데이터를 삭제하는 메서드
     *
     * @param conferenceId 세션 ID
     */
    void clear(UUID conferenceId);

}
