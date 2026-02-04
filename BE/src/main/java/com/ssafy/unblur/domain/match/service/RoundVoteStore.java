package com.ssafy.unblur.domain.match.service;

import com.ssafy.unblur.domain.match.model.VoteChoice;
import com.ssafy.unblur.domain.match.model.VoteState;

import java.util.Set;
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
     * PROCEED 투표자 수를 조회하는 메서드
     *
     * @param conferenceId 세션 ID
     * @return PROCEED 투표자 수
     */
    int getProceedVoterCount(UUID conferenceId);

    /**
     * END 투표자 수를 조회하는 메서드
     *
     * @param conferenceId 세션 ID
     * @return END 투표자 수
     */
    int getEndVoterCount(UUID conferenceId);

    /**
     * PROCEED 투표자 ID 목록을 조회하는 메서드
     *
     * @param conferenceId 세션 ID
     * @return PROCEED 투표자 ID 목록
     */
    Set<UUID> getProceedVoterIds(UUID conferenceId);

    /**
     * END 투표자 ID 목록을 조회하는 메서드
     *
     * @param conferenceId 세션 ID
     * @return END 투표자 ID 목록
     */
    Set<UUID> getEndVoterIds(UUID conferenceId);

    /**
     * 총 투표 수를 조회하는 메서드
     *
     * @param conferenceId 세션 ID
     * @return 총 투표 수
     */
    int getTotalVoteCount(UUID conferenceId);

    /**
     * 세션의 투표를 초기화하는 메서드
     *
     * @param conferenceId 세션 ID
     */
    void resetVotes(UUID conferenceId);

    /**
     * 스킵 투표를 등록하는 메서드
     *
     * @param conferenceId 세션 ID
     * @param userId       사용자 ID
     * @return 신규 등록이면 true
     */
    boolean requestSkip(UUID conferenceId, UUID userId);

    /**
     * 스킵 투표자 수를 조회하는 메서드
     *
     * @param conferenceId 세션 ID
     * @return 스킵 투표자 수
     */
    int getSkipVoterCount(UUID conferenceId);

    /**
     * 스킵 투표를 초기화하는 메서드
     *
     * @param conferenceId 세션 ID
     */
    void resetSkips(UUID conferenceId);

    /**
     * 스킵 투표자 ID 목록을 조회하는 메서드
     *
     * @param conferenceId 세션 ID
     * @return 스킵 투표자 ID 목록
     */
    Set<UUID> getSkipVoterIds(UUID conferenceId);

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
     * 세션 데이터를 완전히 삭제하는 메서드
     *
     * @param conferenceId 세션 ID
     */
    void clear(UUID conferenceId);
}
