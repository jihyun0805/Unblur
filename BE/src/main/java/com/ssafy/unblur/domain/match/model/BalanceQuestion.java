package com.ssafy.unblur.domain.match.model;

/**
 * 밸런스 게임 질문 모델
 *
 * @param id       질문 ID (고유 식별자)
 * @param category 카테고리
 * @param question 질문 내용
 * @param optionA  첫 번째 선택지
 * @param optionB  두 번째 선택지
 */
public record BalanceQuestion(
        String id,
        String category,
        String question,
        String optionA,
        String optionB
) {
}
