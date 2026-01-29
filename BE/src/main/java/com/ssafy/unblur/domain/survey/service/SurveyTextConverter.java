package com.ssafy.unblur.domain.survey.service;

import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.StringJoiner;

@Component
public class SurveyTextConverter {

    private record QuestionDef(String questionText, Map<String, String> options) {
    }

    private static final Map<String, QuestionDef> QUESTIONS = new LinkedHashMap<>();

    static {
        QUESTIONS.put("dateStyle", new QuestionDef("주말의 나는?", Map.of(
                "homebody", "집순이/집돌이",
                "active", "밖돌이/활동파",
                "growth", "갓생러/성장파"
        )));
        QUESTIONS.put("contactStyle", new QuestionDef("연락 스타일은?", Map.of(
                "tikitaka", "티키타카",
                "myway", "마이웨이",
                "voice", "보이스파"
        )));
        QUESTIONS.put("conflictStyle", new QuestionDef("싸웠을 때 나는?", Map.of(
                "direct", "직면형",
                "thoughtful", "숙고형"
        )));
        QUESTIONS.put("spending", new QuestionDef("100만 원이 생긴다면?", Map.of(
                "memory", "추억 수집",
                "desire", "물욕 충족",
                "saver", "통장 요정"
        )));
        QUESTIONS.put("priority", new QuestionDef("1순위로 보는 것?", Map.of(
                "visual", "비주얼",
                "humor", "개그코드",
                "career", "본업존잘",
                "values", "가치관"
        )));
        QUESTIONS.put("agePreference", new QuestionDef("선호 나이", Map.of(
                "older", "연상",
                "same", "동갑",
                "younger", "연하",
                "any", "상관없음"
        )));
        QUESTIONS.put("distancePreference", new QuestionDef("장거리(롱디) 가능 여부", Map.of(
                "near", "근거리 선호",
                "weekend", "주말만 가능",
                "any", "거리 상관없음"
        )));
        QUESTIONS.put("smokingSelf", new QuestionDef("흡연을 하시나요?", Map.of(
                "nonsmoker", "비흡연",
                "social", "가끔(사교)",
                "smoker", "연초 및 전담"
        )));
        QUESTIONS.put("smokingPartner", new QuestionDef("상대방의 흡연 여부를 허용하시나요?", Map.of(
                "any", "상관없음",
                "nonsmoker", "비흡연자만",
                "vape-ok", "전담까진 OK"
        )));
        QUESTIONS.put("drinkingSelf", new QuestionDef("음주를 하시나요?", Map.of(
                "none", "알쓰(못마심)",
                "mood", "기분파",
                "heavy", "애주가"
        )));
        QUESTIONS.put("drinkingPartner", new QuestionDef("상대방의 음주 여부를 허용하시나요?", Map.of(
                "any", "상관없음",
                "light", "금주 및 절주 선호",
                "buddy", "술친구 선호"
        )));
        QUESTIONS.put("religionSelf", new QuestionDef("종교를 믿으시나요?", Map.of(
                "none", "무교",
                "christian", "기독교",
                "catholic", "천주교",
                "buddhist", "불교",
                "etc", "기타"
        )));
        QUESTIONS.put("religionPartner", new QuestionDef("상대방의 종교 여부를 허용하시나요?", Map.of(
                "respect", "존중해요",
                "same", "같은 종교만",
                "no-pressure", "종교 강요 X"
        )));
        QUESTIONS.put("petSelf", new QuestionDef("반려동물을 키우시나요?", Map.of(
                "none", "없음",
                "have", "반려동물 있음",
                "allergy", "알러지 있음"
        )));
        QUESTIONS.put("petPartner", new QuestionDef("상대방의 반려동물 키우기 여부를 허용하시나요?", Map.of(
                "any", "상관없음",
                "like", "동물 좋아해요",
                "prefer-none", "없는 분 선호"
        )));
        QUESTIONS.put("interests", new QuestionDef("관심사 태그", Map.ofEntries(
                Map.entry("fitness", "헬스"),
                Map.entry("running", "러닝"),
                Map.entry("hiking", "등산"),
                Map.entry("golf", "골프"),
                Map.entry("climbing", "클라이밍"),
                Map.entry("baseball", "축구/야구"),
                Map.entry("movie", "영화/OTT"),
                Map.entry("exhibition", "전시"),
                Map.entry("reading", "독서"),
                Map.entry("concert", "콘서트"),
                Map.entry("game", "게임"),
                Map.entry("comic", "만화"),
                Map.entry("food", "맛집"),
                Map.entry("cooking", "요리"),
                Map.entry("cafe", "카페"),
                Map.entry("wine", "와인/술"),
                Map.entry("bread", "빵지순례"),
                Map.entry("travel", "여행"),
                Map.entry("investment", "재테크"),
                Map.entry("pet", "반려동물"),
                Map.entry("drive", "드라이브"),
                Map.entry("idol", "아이돌")
        )));
    }

    @SuppressWarnings("unchecked")
    public String convert(List<Map<String, Object>> detailedInfo) {
        if (detailedInfo == null || detailedInfo.isEmpty()) {
            return null;
        }

        StringJoiner joiner = new StringJoiner("\n");

        for (Map<String, Object> entry : detailedInfo) {
            String questionId = (String) entry.getOrDefault("questionId", entry.get("QuestionId"));
            QuestionDef def = QUESTIONS.get(questionId);
            if (def == null) {
                continue;
            }

            Object answerRaw = entry.getOrDefault("answer", entry.get("Answer"));
            String answerText;

            if (answerRaw instanceof List<?> answers) {
                StringJoiner answerJoiner = new StringJoiner(", ");
                for (Object a : answers) {
                    String label = def.options().getOrDefault(a.toString(), a.toString());
                    answerJoiner.add(label);
                }
                answerText = answerJoiner.toString();
            } else {
                String answerValue = answerRaw.toString();
                answerText = def.options().getOrDefault(answerValue, answerValue);
            }

            joiner.add(def.questionText() + ": " + answerText);
        }

        String result = joiner.toString();
        return result.isEmpty() ? null : result;
    }
}
