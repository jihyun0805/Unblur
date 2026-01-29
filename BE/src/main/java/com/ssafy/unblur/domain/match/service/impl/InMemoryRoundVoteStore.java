package com.ssafy.unblur.domain.match.service.impl;

import com.ssafy.unblur.domain.match.model.VoteChoice;
import com.ssafy.unblur.domain.match.model.VoteState;
import com.ssafy.unblur.domain.match.service.RoundVoteStore;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 인메모리 라운드 투표 저장소 구현체
 */
@Component
public class InMemoryRoundVoteStore implements RoundVoteStore {

    /**
     * 세션별 투표 저장소
     * <p>
     * Key: 컨퍼런스 ID, Value: 세션별 투표 데이터
     */
    private final Map<UUID, ConferenceVoteData> conferenceVotes = new ConcurrentHashMap<>();

    @Override
    public void vote(UUID conferenceId, UUID userId, VoteChoice vote) {
        ConferenceVoteData data = conferenceVotes.computeIfAbsent(conferenceId, k -> new ConferenceVoteData());

        if (vote == VoteChoice.PROCEED) {
            data.proceedVoterIds.add(userId);
        } else {
            data.endVoterIds.add(userId);
        }
    }

    @Override
    public int getProceedVoterCount(UUID conferenceId) {
        ConferenceVoteData data = conferenceVotes.get(conferenceId);
        return data == null ? 0 : data.proceedVoterIds.size();
    }

    @Override
    public int getEndVoterCount(UUID conferenceId) {
        ConferenceVoteData data = conferenceVotes.get(conferenceId);
        return data == null ? 0 : data.endVoterIds.size();
    }

    @Override
    public Set<UUID> getProceedVoterIds(UUID conferenceId) {
        ConferenceVoteData data = conferenceVotes.get(conferenceId);
        return data == null ? Set.of() : Set.copyOf(data.proceedVoterIds);
    }

    @Override
    public Set<UUID> getEndVoterIds(UUID conferenceId) {
        ConferenceVoteData data = conferenceVotes.get(conferenceId);
        return data == null ? Set.of() : Set.copyOf(data.endVoterIds);
    }

    @Override
    public int getTotalVoteCount(UUID conferenceId) {
        ConferenceVoteData data = conferenceVotes.get(conferenceId);
        return data == null ? 0 : data.proceedVoterIds.size() + data.endVoterIds.size();
    }

    @Override
    public void resetVotes(UUID conferenceId) {
        ConferenceVoteData data = conferenceVotes.get(conferenceId);
        if (data != null) {
            data.proceedVoterIds.clear();
            data.endVoterIds.clear();
            data.state = VoteState.WAITING;
        }
    }

    @Override
    public VoteState getVoteState(UUID conferenceId) {
        ConferenceVoteData data = conferenceVotes.get(conferenceId);
        return data == null ? VoteState.WAITING : data.state;
    }

    @Override
    public void setVoteState(UUID conferenceId, VoteState state) {
        ConferenceVoteData data = conferenceVotes.computeIfAbsent(conferenceId, k -> new ConferenceVoteData());
        data.state = state;
    }

    @Override
    public void clear(UUID conferenceId) {
        conferenceVotes.remove(conferenceId);
    }

    /**
     * 세션별 투표 데이터
     */
    private static class ConferenceVoteData {

        /**
         * PROCEED 투표자 ID 목록
         */
        final Set<UUID> proceedVoterIds = ConcurrentHashMap.newKeySet();

        /**
         * END 투표자 ID 목록
         */
        final Set<UUID> endVoterIds = ConcurrentHashMap.newKeySet();

        /**
         * 투표 상태
         */
        volatile VoteState state = VoteState.WAITING;
    }
}
