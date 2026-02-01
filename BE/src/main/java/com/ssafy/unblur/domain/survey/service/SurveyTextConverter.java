package com.ssafy.unblur.domain.survey.service;

import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.StringJoiner;

@Component
public class SurveyTextConverter {

    /**
     * 임베딩 대상 질문 ID (Q1~5: 성향 질문만)
     */
    private static final Set<String> EMBEDDING_QUESTION_IDS = Set.of(
            "dateStyle", "contactStyle", "conflictStyle", "spending", "priority"
    );

    private static final Map<String, Map<String, String>> OPTIONS = new LinkedHashMap<>();

    static {
        OPTIONS.put("dateStyle", Map.of(
                "homebody", "집순이/집돌이",
                "active", "밖돌이/활동파",
                "growth", "갓생러/성장파"
        ));
        OPTIONS.put("contactStyle", Map.of(
                "tikitaka", "티키타카",
                "myway", "마이웨이",
                "voice", "보이스파"
        ));
        OPTIONS.put("conflictStyle", Map.of(
                "direct", "대화로 즉시 풀어나가는 스타일",
                "thoughtful", "생각을 정리한 뒤 대화하는 스타일"
        ));
        OPTIONS.put("spending", Map.of(
                "memory", "추억 수집",
                "desire", "물욕 충족",
                "saver", "통장 요정"
        ));
        OPTIONS.put("priority", Map.of(
                "visual", "비주얼",
                "humor", "개그코드",
                "career", "본업존잘",
                "values", "가치관"
        ));
    }

    /**
     * Q1~5 답변만 쉼표로 연결하여 임베딩용 텍스트를 생성한다.
     */
    @SuppressWarnings("unchecked")
    public String convert(List<Map<String, Object>> detailedInfo) {
        if (detailedInfo == null || detailedInfo.isEmpty()) {
            return null;
        }

        StringJoiner joiner = new StringJoiner(", ");

        for (Map<String, Object> entry : detailedInfo) {
            String questionId = (String) entry.getOrDefault("questionId", entry.get("QuestionId"));
            if (!EMBEDDING_QUESTION_IDS.contains(questionId)) {
                continue;
            }

            Map<String, String> opts = OPTIONS.get(questionId);
            if (opts == null) {
                continue;
            }

            Object answerRaw = entry.getOrDefault("answer", entry.get("Answer"));

            if (answerRaw instanceof List<?> answers) {
                for (Object a : answers) {
                    joiner.add(opts.getOrDefault(a.toString(), a.toString()));
                }
            } else {
                String answerValue = answerRaw.toString();
                joiner.add(opts.getOrDefault(answerValue, answerValue));
            }
        }

        String result = joiner.toString();
        return result.isEmpty() ? null : result;
    }
}
