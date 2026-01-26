package com.ssafy.unblur.domain.match.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 소개팅 세션(컨퍼런스) 정보를 담는 엔티티
 */
@Entity
@Table(name = "conferences")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Conference {

    /**
     * 세션 ID (PK).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * 세션 상태
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ConferenceStatus status;

    /**
     * 현재 라운드 (1~4).
     */
    @Column(name = "current_round", nullable = false)
    private Integer currentRound;

    /**
     * 시작 시각.
     */
    @Column(name = "started_at")
    private LocalDateTime startedAt;

    /**
     * 종료 시각.
     */
    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    /**
     * 생성 시각.
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
