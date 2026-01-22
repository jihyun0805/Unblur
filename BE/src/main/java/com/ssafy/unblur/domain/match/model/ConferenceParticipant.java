package com.ssafy.unblur.domain.match.model;

import com.ssafy.unblur.domain.user.model.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 세션 참여자 매핑 엔티티.
 */
@Entity
@Table(
        name = "conference_participants",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_conference_participants_unique",
                columnNames = {"conference_id", "user_id"}
        )
)
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConferenceParticipant {

    /**
     * 참여자 ID (PK).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * 참여한 세션.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conference_id", nullable = false)
    private Conference conference;

    /**
     * 참여 사용자.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * 입장 시각.
     */
    @CreationTimestamp
    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    /**
     * 퇴장 시각.
     */
    @Column(name = "left_at")
    private LocalDateTime leftAt;
}
