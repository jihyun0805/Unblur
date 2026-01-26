package com.ssafy.unblur.domain.match.model;

import com.ssafy.unblur.domain.auth.model.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 라운드 연장 투표 정보를 저장하는 엔티티.
 */
@Entity
@Table(
        name = "round_votes",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_round_votes_unique",
                columnNames = {"round_id", "user_id"}
        )
)
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoundVote {

    /**
     * 투표 ID (PK).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * 투표 대상 라운드.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "round_id", nullable = false)
    private ConferenceRound round;

    /**
     * 투표한 사용자.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * 연장 의사 여부.
     */
    @Column(name = "wants_continue", nullable = false)
    private boolean wantsContinue;

    /**
     * 투표 시각.
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
