package com.ssafy.unblur.domain.rtc.dto.event;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

import java.util.List;

/**
 * 밸런스 게임 WebSocket 이벤트 메시지 모음
 */
public final class BalanceGameMessages {

    private BalanceGameMessages() {
    }

    /**
     * 밸런스 게임 초대 이벤트
     */
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Invite(
            String type,
            String conferenceId,
            String fromUserId
    ) {
        public Invite {
            if (type == null) {
                type = "balance-invite";
            }
        }
    }

    /**
     * 밸런스 게임 거절 이벤트
     */
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Declined(
            String type,
            String conferenceId,
            String fromUserId
    ) {
        public Declined {
            if (type == null) {
                type = "balance-declined";
            }
        }
    }

    /**
     * 밸런스 게임 시작 이벤트
     */
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Start(
            String type,
            String conferenceId,
            String questionId,
            String category,
            String question,
            String optionA,
            String optionB
    ) {
        public Start {
            if (type == null) {
                type = "balance-start";
            }
        }
    }

    /**
     * 상대방 선택 완료 알림 이벤트
     */
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record PartnerSelected(
            String type,
            String conferenceId,
            String userId
    ) {
        public PartnerSelected {
            if (type == null) {
                type = "balance-selected";
            }
        }
    }

    /**
     * 밸런스 게임 결과 이벤트
     */
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Result(
            String type,
            String conferenceId,
            String questionId,
            String category,
            String question,
            String optionA,
            String optionB,
            Boolean sameChoice,
            List<Selection> selections
    ) {
        public Result {
            if (type == null) {
                type = "balance-result";
            }
        }
    }

    /**
     * 사용자 선택 결과
     */
    @Builder
    public record Selection(
            String userId,
            String choice
    ) {
    }
}
