package com.ssafy.unblur.domain.game.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * 밸런스 게임 질문 엔티티.
 */
@Entity
@Table(name = "game_questions")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameQuestion {

    /**
     * 질문 ID (PK).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * 질문 본문.
     */
    @Column(columnDefinition = "text", nullable = false)
    private String question;

    /**
     * 선택지 A.
     */
    @Column(name = "option_a", nullable = false, length = 255)
    private String optionA;

    /**
     * 선택지 B.
     */
    @Column(name = "option_b", nullable = false, length = 255)
    private String optionB;
}
