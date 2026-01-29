package com.ssafy.unblur.domain.match.service;

import com.ssafy.unblur.domain.match.model.VoteChoice;
import com.ssafy.unblur.domain.match.model.VoteState;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * 라운드 투표 저장소 인터페이스
 */
public interface RoundVoteStore {

    /**
     * 투표를 등록하는 메서드
     *
     * @param conferenceId 세션 ID
     * @param userId       사용자 ID
     * @param vote         투표 내용
     */
    void vote(UUID conferenceId, UUID userId, VoteChoice vote);

    /**
     * 세션의 모든 투표를 조회하는 메서드
     *
     * @param conferenceId 세션 ID
     * @return 사용자별 투표 맵 (Key: 사용자 ID, Value: 투표 내용)
     */
    Map<UUID, VoteChoice> getAllVotes(UUID conferenceId);

    /**
     * 투표 수를 조회하는 메서드
     *
     * @param conferenceId 세션 ID
     * @return 투표한 사용자 수
     */
    int getVoteCount(UUID conferenceId);

    /**
     * 세션의 투표를 초기화하는 메서드
     *
     * @param conferenceId 세션 ID
     */
    void resetVotes(UUID conferenceId);

    /**
     * 세션의 투표 상태를 조회하는 메서드
     *
     * @param conferenceId 세션 ID
     * @return 투표 상태
     */
    VoteState getVoteState(UUID conferenceId);

    /**
     * 세션의 투표 상태를 설정하는 메서드
     *
     * @param conferenceId 세션 ID
     * @param state        투표 상태
     */
    void setVoteState(UUID conferenceId, VoteState state);

    /**
     * 재확인 대상 사용자 ID를 설정하는 메서드
     *
     * @param conferenceId 세션 ID
     * @param userId       재확인 대상 사용자 ID
     */
    void setConfirmingUser(UUID conferenceId, UUID userId);

    /**
     * 재확인 대상 사용자 ID를 조회하는 메서드
     *
     * @param conferenceId 세션 ID
     * @return 재확인 대상 사용자 ID
     */
    Optional<UUID> getConfirmingUser(UUID conferenceId);

    /**
     * 세션 데이터를 완전히 삭제하는 메서드
     *
     * @param conferenceId 세션 ID
     */
    void clear(UUID conferenceId);
}
