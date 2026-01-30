package com.ssafy.unblur.domain.game.dto.response;

import com.ssafy.unblur.domain.game.model.QuestionDictionary;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

import java.util.UUID;

@Builder
public record QuestionDictionaryResponseDto(
        @Schema(description = "질문 ID", example = "550e8400-e29b-41d4-a716-446655440000")
        UUID id,

        @Schema(description = "질문 본문", example = "좋아하는 음식은 무엇인가요?")
        String question,

        @Schema(description = "라운드 구간 (ROUND_1, ROUND_2, ROUND_3_4)", example = "ROUND_1")
        String roundGroup
) {

    public static QuestionDictionaryResponseDto from(QuestionDictionary entity) {
        return QuestionDictionaryResponseDto.builder()
                .id(entity.getId())
                .question(entity.getQuestion())
                .roundGroup(entity.getRoundGroup().name())
                .build();
    }
}