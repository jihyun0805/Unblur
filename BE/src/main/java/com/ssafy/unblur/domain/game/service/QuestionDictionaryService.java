package com.ssafy.unblur.domain.game.service;

import com.ssafy.unblur.domain.game.dto.response.QuestionDictionaryResponseDto;
import com.ssafy.unblur.domain.game.model.QuestionDictionary;
import com.ssafy.unblur.domain.game.model.RoundGroup;
import com.ssafy.unblur.domain.game.repository.QuestionDictionaryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class QuestionDictionaryService {

    private static final int QUESTIONS_PER_ROUND = 5;

    private final QuestionDictionaryRepository questionDictionaryRepository;

    @Transactional(readOnly = true)
    public Map<String, List<QuestionDictionaryResponseDto>> getRandomQuestionsForMatch() {
        Map<String, List<QuestionDictionaryResponseDto>> result = new LinkedHashMap<>();

        for (RoundGroup group : RoundGroup.values()) {
            List<QuestionDictionary> questions = new ArrayList<>(
                    questionDictionaryRepository.findByRoundGroup(group)
            );
            Collections.shuffle(questions);

            List<QuestionDictionaryResponseDto> picked = questions.stream()
                    .limit(QUESTIONS_PER_ROUND)
                    .map(QuestionDictionaryResponseDto::from)
                    .toList();

            result.put(group.name(), picked);
        }

        return result;
    }
}
