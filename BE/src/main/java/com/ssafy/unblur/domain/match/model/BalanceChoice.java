package com.ssafy.unblur.domain.match.model;

/**
 * 밸런스 게임 선택 값
 * <p>
 * UI에서는 A/B 형태로 표현하며, 선택이 없을 경우 NONE으로 기록한다.
 * NONE은 서버 내부 처리용으로만 사용되며, 사용자 입력으로는 허용하지 않는다.
 * </p>
 */
public enum BalanceChoice {
    OPTION_A,
    OPTION_B,
    NONE;

    /**
     * 선택 문자열을 enum으로 변환하는 메서드
     *
     * @param raw 입력 문자열
     * @return OPTION_A 또는 OPTION_B
     * @throws IllegalArgumentException 선택 값이 비어 있거나 유효하지 않은 경우
     */
    public static BalanceChoice from(String raw) {
        // null 체크
        if (raw == null) {
            throw new IllegalArgumentException("선택 값이 필요합니다.");
        }

        // 정규화 및 매핑
        String normalized = raw.trim().toUpperCase();
        return switch (normalized) {
            case "A" -> OPTION_A;
            case "B" -> OPTION_B;
            default -> throw new IllegalArgumentException("올바르지 않은 선택 값입니다: " + raw);
        };
    }
}
