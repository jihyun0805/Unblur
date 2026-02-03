package com.ssafy.unblur.domain.survey.service;

import org.springframework.stereotype.Component;

import java.util.*;

/**
 * 두 유저의 설문 응답(detailedInfo)을 문항별로 비교하여 유사도(0.0 ~ 1.0)를 계산한다.
 *
 * <h3>비교 방식</h3>
 * <ol>
 *   <li><b>직접 비교 (DIRECT_QUESTIONS)</b> — 동일 문항의 응답이 같으면 일치.
 *       대상: dateStyle, contactStyle, conflictStyle, spending, priority</li>
 *   <li><b>복수 선택 교집합 (agePreference)</b> — 양쪽 응답의 교집합이 존재하면 일치.
 *       "any" 응답은 무조건 일치로 처리.</li>
 *   <li><b>단일 선택 + any (distancePreference)</b> — 값이 같거나 한쪽이 "any"이면 일치.</li>
 *   <li><b>교차 비교 (CROSS_PAIRS)</b> — A의 self 응답과 B의 partner 선호를 비교하고,
 *       반대 방향도 비교. "any"/"respect" 응답은 무조건 일치.
 *       대상: smoking, drinking, religion, pet</li>
 * </ol>
 *
 * <h3>점수 산출</h3>
 * {@code matched / compared} (비교 가능 항목이 없으면 0.0)
 */
@Component
public class SurveySimilarityCalculator {

    /**
     * 양쪽 응답을 직접 동등 비교하는 문항 ID 목록.
     */
    private static final List<String> DIRECT_QUESTIONS = List.of(
            "dateStyle", "contactStyle", "conflictStyle", "spending", "priority"
    );

    /**
     * 교차 비교 쌍. {@code [selfKey, partnerKey]} 형태로,
     * A.self vs B.partner / B.self vs A.partner 양방향 비교를 수행한다.
     */
    /**
     * petPartner 허용 범위.
     * any → none+have, prefer-none → none만.
     */
    private static final Map<String, Set<String>> PET_ALLOWED = Map.of(
            "any", Set.of("none", "have"),
            "prefer-none", Set.of("none")
    );

    /**
     * drinkingPartner 허용 범위 (계층적).
     * limit → none+social, buddy → social+lover, any → 전부.
     */
    private static final Map<String, Set<String>> DRINKING_ALLOWED = Map.of(
            "limit", Set.of("none", "social"),
            "buddy", Set.of("social", "lover"),
            "any", Set.of("none", "social", "lover")
    );

    /**
     * smokingPartner 허용 범위 (계층적).
     * nonsmoker → nonsmoker만, vape → nonsmoker+vape, any → 전부.
     */
    private static final Map<String, Set<String>> SMOKING_ALLOWED = Map.of(
            "nonsmoker", Set.of("nonsmoker"),
            "vape", Set.of("nonsmoker", "vape"),
            "any", Set.of("nonsmoker", "vape", "smoker")
    );

    /**
     * 이 값이 응답에 포함되면 무조건 일치로 간주한다.
     */
    private static final Set<String> ANY_VALUES = Set.of("any", "respect");

    /**
     * 두 유저의 detailedInfo를 비교하여 유사도를 계산한다.
     *
     * @param infoA 유저 A의 detailedInfo
     * @param infoB 유저 B의 detailedInfo
     * @return 유사도 (0.0~1.0), 비교 가능 항목이 없으면 0.0
     */
    public double calculate(List<Map<String, Object>> infoA, List<Map<String, Object>> infoB) {
        if (infoA == null || infoB == null) {
            return 0.0;
        }

        Map<String, Object> mapA = toAnswerMap(infoA);
        Map<String, Object> mapB = toAnswerMap(infoB);

        int matched = 0;
        int compared = 0;

        // 1~5: 단일 선택 비교
        for (String q : DIRECT_QUESTIONS) {
            Object a = mapA.get(q);
            Object b = mapB.get(q);
            if (a == null && b == null) continue;
            compared++;
            if (a != null && a.equals(b)) matched++;
        }

        // 6: agePreference (복수 선택, 교집합)
        Object ageA = mapA.get("agePreference");
        Object ageB = mapB.get("agePreference");
        if (ageA != null || ageB != null) {
            compared++;
            if (hasAnyValue(ageA) || hasAnyValue(ageB)) {
                matched++;
            } else if (ageA != null && ageB != null) {
                Set<String> setA = toStringSet(ageA);
                Set<String> setB = toStringSet(ageB);
                setA.retainAll(setB);
                if (!setA.isEmpty()) matched++;
            }
        }

        // 7: distancePreference (단일, any 포함)
        Object distA = mapA.get("distancePreference");
        Object distB = mapB.get("distancePreference");
        if (distA != null || distB != null) {
            compared++;
            if (hasAnyValue(distA) || hasAnyValue(distB)) {
                matched++;
            } else if (distA != null && distA.equals(distB)) {
                matched++;
            }
        }

        // 8~9: 흡연 교차 비교 (계층적 허용 범위)
        // A.smokingSelf vs B.smokingPartner
        String aSmokingSelf = toStr(mapA.get("smokingSelf"));
        String bSmokingPartner = toStr(mapB.get("smokingPartner"));
        if (aSmokingSelf != null || bSmokingPartner != null) {
            compared++;
            if (isSmokingMatch(aSmokingSelf, bSmokingPartner)) matched++;
        }
        // B.smokingSelf vs A.smokingPartner
        String bSmokingSelf = toStr(mapB.get("smokingSelf"));
        String aSmokingPartner = toStr(mapA.get("smokingPartner"));
        if (bSmokingSelf != null || aSmokingPartner != null) {
            compared++;
            if (isSmokingMatch(bSmokingSelf, aSmokingPartner)) matched++;
        }

        // 10~11: 음주 교차 비교 (계층적 허용 범위)
        // A.drinkingSelf vs B.drinkingPartner
        String aDrinkingSelf = toStr(mapA.get("drinkingSelf"));
        String bDrinkingPartner = toStr(mapB.get("drinkingPartner"));
        if (aDrinkingSelf != null || bDrinkingPartner != null) {
            compared++;
            if (isDrinkingMatch(aDrinkingSelf, bDrinkingPartner)) matched++;
        }
        // B.drinkingSelf vs A.drinkingPartner
        String bDrinkingSelf = toStr(mapB.get("drinkingSelf"));
        String aDrinkingPartner = toStr(mapA.get("drinkingPartner"));
        if (bDrinkingSelf != null || aDrinkingPartner != null) {
            compared++;
            if (isDrinkingMatch(bDrinkingSelf, aDrinkingPartner)) matched++;
        }

        // 12~13: 종교 교차 비교 (respect=무조건 일치, same=양쪽 종교 동일해야 일치)
        String aReligionSelf = toStr(mapA.get("religionSelf"));
        String bReligionSelf = toStr(mapB.get("religionSelf"));
        String aReligionPartner = toStr(mapA.get("religionPartner"));
        String bReligionPartner = toStr(mapB.get("religionPartner"));
        // A의 선호 vs B의 종교
        if (aReligionPartner != null || bReligionSelf != null) {
            compared++;
            if (isReligionMatch(aReligionPartner, aReligionSelf, bReligionSelf)) matched++;
        }
        // B의 선호 vs A의 종교
        if (bReligionPartner != null || aReligionSelf != null) {
            compared++;
            if (isReligionMatch(bReligionPartner, bReligionSelf, aReligionSelf)) matched++;
        }

        // 14~15: 반려동물 교차 비교 (계층적 허용 범위)
        String aPetSelf = toStr(mapA.get("petSelf"));
        String bPetPartner = toStr(mapB.get("petPartner"));
        if (aPetSelf != null || bPetPartner != null) {
            compared++;
            if (isPetMatch(aPetSelf, bPetPartner)) matched++;
        }
        String bPetSelf = toStr(mapB.get("petSelf"));
        String aPetPartner = toStr(mapA.get("petPartner"));
        if (bPetSelf != null || aPetPartner != null) {
            compared++;
            if (isPetMatch(bPetSelf, aPetPartner)) matched++;
        }

        return compared == 0 ? 0.0 : (double) matched / compared;
    }

    /**
     * detailedInfo 리스트를 {@code questionId → answer} 맵으로 변환한다.
     * questionId 키는 "questionId" 또는 "QuestionId" 두 형태를 모두 지원한다.
     */
    private Map<String, Object> toAnswerMap(List<Map<String, Object>> info) {
        Map<String, Object> map = new HashMap<>();
        for (Map<String, Object> entry : info) {
            String questionId = (String) entry.getOrDefault("questionId", entry.get("QuestionId"));
            if (questionId == null) continue;
            Object answer = entry.getOrDefault("answer", entry.get("Answer"));
            if (answer != null) map.put(questionId, answer);
        }
        return map;
    }

    /**
     * 값이 {@link #ANY_VALUES}에 해당하는지 확인한다.
     * 리스트인 경우 요소 중 하나라도 해당하면 {@code true}.
     */
    private boolean hasAnyValue(Object value) {
        if (value == null) return false;
        if (value instanceof List<?> list) {
            return list.stream().anyMatch(v -> ANY_VALUES.contains(v.toString()));
        }
        return ANY_VALUES.contains(value.toString());
    }

    /**
     * 값을 {@code Set<String>}으로 변환한다. 리스트이면 각 요소를, 단일 값이면 그대로 추가.
     */
    private String toStr(Object value) {
        return value == null ? null : value.toString();
    }

    /**
     * 흡연 교차 비교. partner 허용 범위에 self 값이 포함되면 일치.
     */
    private boolean isSmokingMatch(String selfValue, String partnerPref) {
        if (selfValue == null || partnerPref == null) return false;
        Set<String> allowed = SMOKING_ALLOWED.get(partnerPref);
        return allowed != null && allowed.contains(selfValue);
    }

    /**
     * 반려동물 교차 비교. partner 허용 범위에 self 값이 포함되면 일치.
     */
    private boolean isPetMatch(String selfValue, String partnerPref) {
        if (selfValue == null || partnerPref == null) return false;
        Set<String> allowed = PET_ALLOWED.get(partnerPref);
        return allowed != null && allowed.contains(selfValue);
    }

    /**
     * 종교 교차 비교. respect이면 무조건 일치, same이면 양쪽 종교가 같아야 일치.
     */
    private boolean isReligionMatch(String partnerPref, String myReligion, String theirReligion) {
        if (partnerPref == null) return false;
        if ("respect".equals(partnerPref)) return true;
        if ("same".equals(partnerPref)) return myReligion != null && myReligion.equals(theirReligion);
        return false;
    }

    /**
     * 음주 교차 비교. partner 허용 범위에 self 값이 포함되면 일치.
     */
    private boolean isDrinkingMatch(String selfValue, String partnerPref) {
        if (selfValue == null || partnerPref == null) return false;
        Set<String> allowed = DRINKING_ALLOWED.get(partnerPref);
        return allowed != null && allowed.contains(selfValue);
    }

    @SuppressWarnings("unchecked")
    private Set<String> toStringSet(Object value) {
        Set<String> set = new HashSet<>();
        if (value instanceof List<?> list) {
            list.forEach(v -> set.add(v.toString()));
        } else {
            set.add(value.toString());
        }
        return set;
    }
}
