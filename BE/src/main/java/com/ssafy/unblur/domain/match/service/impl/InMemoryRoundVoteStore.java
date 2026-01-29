package com.ssafy.unblur.domain.match.service.impl;

import com.ssafy.unblur.domain.match.model.VoteChoice;
import com.ssafy.unblur.domain.match.model.VoteState;
import com.ssafy.unblur.domain.match.service.RoundVoteStore;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;
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
        data.votes.put(userId, vote);
    }

    @Override
    public Map<UUID, VoteChoice> getAllVotes(UUID conferenceId) {
        ConferenceVoteData data = conferenceVotes.get(conferenceId);
        if (data == null) {
            return Map.of();
        }

        return Map.copyOf(data.votes);
    }

    @Override
    public int getVoteCount(UUID conferenceId) {
        ConferenceVoteData data = conferenceVotes.get(conferenceId);
        if (data == null) {
            return 0;
        }

        return data.votes.size();
    }

    @Override
    public void resetVotes(UUID conferenceId) {
        ConferenceVoteData data = conferenceVotes.get(conferenceId);
        if (data != null) {
            data.votes.clear();
            data.state = VoteState.WAITING;
            data.confirmingUserId = null;
        }
    }

    @Override
    public VoteState getVoteState(UUID conferenceId) {
        ConferenceVoteData data = conferenceVotes.get(conferenceId);
        if (data == null) {
            return VoteState.WAITING;
        }

        return data.state;
    }

    @Override
    public void setVoteState(UUID conferenceId, VoteState state) {
        ConferenceVoteData data = conferenceVotes.computeIfAbsent(conferenceId, k -> new ConferenceVoteData());
        data.state = state;
    }

    @Override
    public void setConfirmingUser(UUID conferenceId, UUID userId) {
        ConferenceVoteData data = conferenceVotes.computeIfAbsent(conferenceId, k -> new ConferenceVoteData());
        data.confirmingUserId = userId;
    }

    @Override
    public Optional<UUID> getConfirmingUser(UUID conferenceId) {
        ConferenceVoteData data = conferenceVotes.get(conferenceId);
        if (data == null) {
            return Optional.empty();
        }

        return Optional.ofNullable(data.confirmingUserId);
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
         * 사용자별 투표 맵
         * <p>
         * Key: 사용자 ID, Value: 투표 선택
         */
        final Map<UUID, VoteChoice> votes = new ConcurrentHashMap<>();

        /**
         * 투표 상태
         */
        volatile VoteState state = VoteState.WAITING;

        /**
         * 재확인 대상 사용자 ID
         */
        volatile UUID confirmingUserId;
    }
}
