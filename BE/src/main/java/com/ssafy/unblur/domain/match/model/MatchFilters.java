package com.ssafy.unblur.domain.match.model;

import com.ssafy.unblur.domain.auth.model.LoveDna;
import com.ssafy.unblur.domain.auth.model.Region;

import java.util.Map;

/**
 * 매칭 필터 정보를 담는 레코드
 *
 * @param ageMin  최소 나이
 * @param ageMax  최대 나이
 * @param region  선호 지역
 * @param loveDna 선호 Love DNA
 */
public record MatchFilters(
        Integer ageMin,
        Integer ageMax,
        Region region,
        LoveDna loveDna
) {

    /**
     * 요청 필터 맵에서 매칭 필터를 생성하는 메서드
     * <p>
     * 유효하지 않은 값은 null로 치환하며, 없는 값은 기본 null로 처리한다
     *
     * @param filters 필터 맵
     * @return 매칭 필터
     */
    public static MatchFilters from(Map<String, Object> filters) {
        if (filters == null) {
            return new MatchFilters(null, null, null, null);
        }

        Integer ageMin = toInteger(filters.get("ageMin"));
        Integer ageMax = toInteger(filters.get("ageMax"));
        Region region = toRegion(filters.get("region"));
        LoveDna loveDna = toLoveDna(filters.get("loveDna"));

        return new MatchFilters(ageMin, ageMax, region, loveDna);
    }

    private static Integer toInteger(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof Number number) {
            return number.intValue();
        }

        try {
            return Integer.parseInt(value.toString());

        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * 지역 값을 Region으로 변환하는 메서드
     *
     * @param value 원본 값
     * @return 변환된 Region, 없으면 null
     */
    private static Region toRegion(Object value) {
        if (value == null) {
            return null;
        }

        String raw = value.toString().trim().toUpperCase();
        try {
            return Region.valueOf(raw);

        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /**
     * Love DNA 값을 LoveDna로 변환하는 메서드
     *
     * @param value 원본 값
     * @return 변환된 LoveDna, 없으면 null
     */
    private static LoveDna toLoveDna(Object value) {
        if (value == null) {
            return null;
        }

        String raw = value.toString().trim().toUpperCase();
        try {
            return LoveDna.valueOf(raw);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
