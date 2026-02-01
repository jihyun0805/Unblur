package com.ssafy.unblur.domain.survey.service;

import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Q6~15 설문 답변에 대한 Hard/Boolean Matching 점수를 계산한다.
 * <p>
 * Self/Partner 쌍(흡연/음주/종교/반려동물)은 양방향 검증을 수행한다.
 */
@Component
public class SurveySimilarityCalculator {

    private static final Set<String> ANY_VALUES = Set.of("any", "respect");

    private static final List<String[]> SELF_PARTNER_PAIRS = List.of(
            new String[]{"smokingSelf", "smokingPartner"},
            new String[]{"drinkingSelf", "drinkingPartner"},
            new String[]{"religionSelf", "religionPartner"},
            new String[]{"petSelf", "petPartner"}
    );

    /**
     * 두 유저의 detailedInfo로부터 Hard Matching 점수(0.0 ~ 1.0)를 계산한다.
     */
    public double calculate(List<Map<String, Object>> infoA, List<Map<String, Object>> infoB) {
        if (infoA == null || infoB == null || infoA.isEmpty() || infoB.isEmpty()) {
            return 0.0;
        }

        Map<String, Object> mapA = toAnswerMap(infoA);
        Map<String, Object> mapB = toAnswerMap(infoB);

        int matches = 0;
        int comparisons = 0;

        // Q6: agePreference (복수 선택, 교집합)
        if (mapA.containsKey("agePreference") && mapB.containsKey("agePreference")) {
            comparisons++;
            if (hasMultiSelectMatch(mapA.get("agePreference"), mapB.get("agePreference"))) {
                matches++;
            }
        }

        // Q7: distancePreference (단일 선택)
        if (mapA.containsKey("distancePreference") && mapB.containsKey("distancePreference")) {
            comparisons++;
            if (singleMatch(mapA.get("distancePreference"), mapB.get("distancePreference"))) {
                matches++;
            }
        }

        // Q8~15: Self/Partner 쌍 양방향 검증
        for (String[] pair : SELF_PARTNER_PAIRS) {
            String selfKey = pair[0];
            String partnerKey = pair[1];

            // A의 self ↔ B의 partner
            if (mapA.containsKey(selfKey) && mapB.containsKey(partnerKey)) {
                comparisons++;
                if (selfPartnerMatch(mapA.get(selfKey), mapB.get(partnerKey))) {
                    matches++;
                }
            }

            // B의 self ↔ A의 partner
            if (mapB.containsKey(selfKey) && mapA.containsKey(partnerKey)) {
                comparisons++;
                if (selfPartnerMatch(mapB.get(selfKey), mapA.get(partnerKey))) {
                    matches++;
                }
            }
        }

        if (comparisons == 0) {
            return 0.0;
        }

        return (double) matches / comparisons;
    }

    private Map<String, Object> toAnswerMap(List<Map<String, Object>> detailedInfo) {
        Map<String, Object> result = new HashMap<>();
        for (Map<String, Object> entry : detailedInfo) {
            String questionId = (String) entry.getOrDefault("questionId", entry.get("QuestionId"));
            if (questionId != null) {
                Object answer = entry.getOrDefault("answer", entry.get("Answer"));
                result.put(questionId, answer);
            }
        }
        return result;
    }

    private boolean hasMultiSelectMatch(Object a, Object b) {
        Set<String> setA = toStringSet(a);
        Set<String> setB = toStringSet(b);

        if (containsAny(setA) || containsAny(setB)) {
            return true;
        }

        setA.retainAll(setB);
        return !setA.isEmpty();
    }

    private boolean singleMatch(Object a, Object b) {
        String valA = toSingleString(a);
        String valB = toSingleString(b);

        if (ANY_VALUES.contains(valA) || ANY_VALUES.contains(valB)) {
            return true;
        }

        return valA.equals(valB);
    }

    private boolean selfPartnerMatch(Object selfVal, Object partnerVal) {
        String partner = toSingleString(partnerVal);

        if (ANY_VALUES.contains(partner)) {
            return true;
        }

        String self = toSingleString(selfVal);

        if (ANY_VALUES.contains(self)) {
            return true;
        }

        return self.equals(partner);
    }

    @SuppressWarnings("unchecked")
    private Set<String> toStringSet(Object value) {
        Set<String> set = new HashSet<>();
        if (value instanceof List<?> list) {
            for (Object item : list) {
                set.add(item.toString());
            }
        } else if (value != null) {
            set.add(value.toString());
        }
        return set;
    }

    private boolean containsAny(Set<String> set) {
        for (String v : set) {
            if (ANY_VALUES.contains(v)) {
                return true;
            }
        }
        return false;
    }

    private String toSingleString(Object value) {
        if (value instanceof List<?> list && !list.isEmpty()) {
            return list.get(0).toString();
        }
        return value != null ? value.toString() : "";
    }
}
