package com.ssafy.unblur.domain.match.service;

import java.util.UUID;

/**
 * 밸런스 게임(WebSocket) 처리 서비스 인터페이스
 */
public interface BalanceGameService {

    /**
     * 밸런스 게임 초대를 처리하는 메서드
     * <p>
     * 초대는 10초 내 응답이 없으면 자동 거절 처리된다.
     * </p>
     *
     * @param conferenceId 세션 ID
     * @param fromUserId   초대한 사용자 ID
     * @throws IllegalStateException 세션 참여자 검증 실패 또는 이미 진행 중인 게임이 있는 경우
     */
    void invite(UUID conferenceId, UUID fromUserId);

    /**
     * 밸런스 게임 초대 응답을 처리하는 메서드
     *
     * @param conferenceId 세션 ID
     * @param fromUserId   응답한 사용자 ID
     * @param accepted     수락 여부
     * @throws IllegalStateException 대기 중인 초대가 없거나, 응답 권한이 없는 경우
     */
    void respond(UUID conferenceId, UUID fromUserId, boolean accepted);

    /**
     * 밸런스 게임 선택을 처리하는 메서드
     * <p>
     * 선택은 게임 시작 후 10초 내 제출되어야 하며, 미제출 시 선택 안 함(NONE)으로 처리된다.
     * </p>
     *
     * @param conferenceId 세션 ID
     * @param userId       선택한 사용자 ID
     * @param choiceRaw    선택 값(A/B)
     * @throws IllegalStateException    게임이 시작되지 않았거나, 참여자가 아니거나, 중복 선택인 경우
     * @throws IllegalArgumentException 선택 값이 유효하지 않은 경우
     */
    void select(UUID conferenceId, UUID userId, String choiceRaw);
}
