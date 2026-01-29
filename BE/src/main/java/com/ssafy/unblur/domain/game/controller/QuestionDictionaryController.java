package com.ssafy.unblur.domain.game.controller;

import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.domain.game.dto.QuestionDictionaryResponseDto;
import com.ssafy.unblur.domain.game.service.QuestionDictionaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/questions")
@RequiredArgsConstructor
public class QuestionDictionaryController implements QuestionDictionaryApiDocs {

    private final QuestionDictionaryService questionDictionaryService;

    @Override
    @GetMapping
    public ResponseEntity<BaseResponse<Map<String, List<QuestionDictionaryResponseDto>>>> getMatchQuestions() {
        Map<String, List<QuestionDictionaryResponseDto>> questions =
                questionDictionaryService.getRandomQuestionsForMatch();
        return ResponseEntity.ok(
                BaseResponse.onSuccess("질문 조회 성공", questions)
        );
    }
}
