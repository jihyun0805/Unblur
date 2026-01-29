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
     * 라운드 실제 진행 시간(초).
     */
    @Column(name = "duration_seconds")
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

    @Column(name = "summary_text", columnDefinition = "text")
    private String summaryText;

    /**
     * 진행 상태
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ConferenceRoundStatus status;

    /**
     * 라운드를 종료 상태로 전환하는 메서드
     *
     * @param endedAt 종료 시각
     */
    public void complete(LocalDateTime endedAt) {
        this.status = ConferenceRoundStatus.COMPLETED;
        this.endedAt = endedAt;

        if (startedAt != null && endedAt != null) {
            long seconds = java.time.Duration.between(startedAt, endedAt).getSeconds();
            this.durationSeconds = (int) Math.max(seconds, 0);
        }
    }

    public void updateSummary(String summaryText) {
        this.summaryText = summaryText;
    }
}
