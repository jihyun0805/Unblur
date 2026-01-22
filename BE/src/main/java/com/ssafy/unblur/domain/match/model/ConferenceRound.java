package com.ssafy.unblur.domain.match.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 세션 내 라운드 진행 정보를 저장하는 엔티티.
 */
@Entity
@Table(
        name = "conference_rounds",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_conference_round_unique",
                columnNames = {"conference_id", "round_number"}
        )
)
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConferenceRound {

    /**
     * 라운드 ID (PK).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * 소속 세션.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conference_id", nullable = false)
    private Conference conference;

    /**
     * 라운드 번호 (1~4).
     */
    @Column(name = "round_number", nullable = false)
    private Integer roundNumber;

    /**
     * 진행 시간 (초).
     */
    @Column(name = "duration_seconds", nullable = false)
    private Integer durationSeconds;

    /**
     * 시작 시각.
     */
    @CreationTimestamp
    @Column(name = "started_at", nullable = false, updatable = false)
    private LocalDateTime startedAt;

    /**
     * 종료 시각.
     */
    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    /**
     * 진행 상태 (active/completed/extended).
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ConferenceRoundStatus status;
}
