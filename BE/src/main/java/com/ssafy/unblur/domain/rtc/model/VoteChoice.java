package com.ssafy.unblur.domain.rtc.model;

/**
 * 라운드 진행 투표 선택
 */
public enum VoteChoice {

    /**
     * 다음 라운드 진행
     */
    PROCEED,

    /**
     * 세션 종료
     */
    END;

    /**
     * boolean으로 변환 (PROCEED = true, END = false)
     */
    public boolean toWantsContinue() {
        return this == PROCEED;
    }
}
