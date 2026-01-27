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
 * 부적절한 사용자 신고 정보를 저장하는 엔티티.
 */
@Entity
@Table(name = "user_reports")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserReport {

    /**
     * 신고 ID (PK).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * 신고자.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    /**
     * 피신고자.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_id", nullable = false)
    private User reported;

    /**
     * 관련 소개팅 세션
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conference_id")
    private Conference conference;

    /**
     * 상세 설명.
     */
    @Column(columnDefinition = "text")
    private String description;

    /**
     * 처리 상태.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserReportStatus status;

    /**
     * 생성 시각.
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

}
