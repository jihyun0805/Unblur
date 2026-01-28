package com.ssafy.unblur.domain.chat.model;

import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.match.model.Conference;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 컨퍼런스 내 채팅 메시지 엔티티
 */
@Entity
@Table(name = "chat_messages")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    /**
     * 메시지 ID (PK)
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * 소속 컨퍼런스
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conference_id", nullable = false)
    private Conference conference;

    /**
     * 발신자 (시스템 메시지는 null 가능)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    /**
     * 메시지 유형
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false, length = 20)
    private ChatMessageType messageType;

    /**
     * 메시지 본문
     */
    @Column(columnDefinition = "text", nullable = false)
    private String content;

    /**
     * 전송 시각
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}