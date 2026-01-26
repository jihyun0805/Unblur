package com.ssafy.unblur.domain.auth.model;

import com.ssafy.unblur.domain.match.model.Conference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 세션 종료 후 상대방 선명도 평가를 저장하는 엔티티.
 */
@Entity
@Table(
        name = "clarity_evaluations",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_clarity_evaluation_unique",
                columnNames = {"evaluator_id", "target_id", "conference_id"}
        )
)
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClarityEvaluation {

    /**
     * 평가 ID (PK).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * 평가자.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluator_id", nullable = false)
    private User evaluator;

    /**
     * 평가 대상자.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_id", nullable = false)
    private User target;

    /**
     * 평가가 이루어진 소개팅 세션.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conference_id", nullable = false)
    private Conference conference;

    /**
     * 평가 점수 (1~5).
     */
    @Column(nullable = false)
    private Integer score;

    /**
     * 생성 시각.
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
