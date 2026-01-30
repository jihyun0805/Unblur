package com.ssafy.unblur.domain.game.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "question_dictionary")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionDictionary {

    /**
     * 질문 ID(PK)
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "question_id")
    private UUID id;

    /**
     * 질문 본문
     */
    @Column(columnDefinition = "text", nullable = false)
    private String question;

    /**
     * 라운드 구간 (ROUND_1, ROUND_2, ROUND_3_4)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "round_group", nullable = false, length = 20)
    private RoundGroup roundGroup;
}
