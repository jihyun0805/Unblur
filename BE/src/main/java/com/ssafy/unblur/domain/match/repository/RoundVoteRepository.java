package com.ssafy.unblur.domain.match.repository;

import com.ssafy.unblur.domain.match.model.RoundVote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

/**
 * 라운드 투표 레포지토리
 */
public interface RoundVoteRepository extends JpaRepository<RoundVote, UUID> {

    /**
     * 라운드와 사용자로 투표 조회하는 메서드
     *
     * @param roundId 라운드 ID
     * @param userId  사용자 ID
     * @return 투표 정보
     */
    Optional<RoundVote> findByRound_IdAndUser_Id(UUID roundId, UUID userId);
}
