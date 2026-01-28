package com.ssafy.unblur.domain.rtc.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

/**
 * 라운드/투표 관련 WebSocket 메시지 모음
 */
public final class RoundMessages {

    private RoundMessages() {
    }

    /**
     * 라운드 시간 종료 메시지
     */
    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class RoundTimeUp {
        private final String type = "round-time-up";
        private final String conferenceId;
        private final int roundNumber;
        private final String message;

        public static RoundTimeUp of(String conferenceId, int roundNumber) {
            return RoundTimeUp.builder()
                    .conferenceId(conferenceId)
                    .roundNumber(roundNumber)
                    .message("라운드가 종료되었습니다. 다음 라운드로 진행할지 선택해주세요.")
                    .build();
        }
    }

    /**
     * 상대방 투표 완료 알림 메시지
     */
    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PartnerVoted {
        private final String type = "partner-voted";
        private final String conferenceId;
        private final String message;

        public static PartnerVoted of(String conferenceId) {
            return PartnerVoted.builder()
                    .conferenceId(conferenceId)
                    .message("상대방이 투표했어요. 다음 라운드로 진행할지 선택해주세요.")
                    .build();
        }
    }

    /**
     * 투표 재확인 요청 메시지
     */
    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class VoteConfirmRequest {
        private final String type = "vote-confirm-request";
        private final String conferenceId;
        private final String message;

        public static VoteConfirmRequest of(String conferenceId) {
            return VoteConfirmRequest.builder()
                    .conferenceId(conferenceId)
                    .message("상대방은 계속하고 싶어해요. 정말 종료하시겠어요?")
                    .build();
        }
    }

    /**
     * 투표 재확인 대기 메시지
     */
    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class VoteWaitingConfirm {
        private final String type = "vote-waiting-confirm";
        private final String conferenceId;
        private final String message;

        public static VoteWaitingConfirm of(String conferenceId) {
            return VoteWaitingConfirm.builder()
                    .conferenceId(conferenceId)
                    .message("상대방이 결정 중이에요. 잠시만 기다려주세요.")
                    .build();
        }
    }

    /**
     * 새 라운드 시작 메시지
     */
    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class RoundStarted {
        private final String type = "round-started";
        private final String conferenceId;
        private final int roundNumber;
        private final boolean isUnlimited;
    }

    /**
     * 세션 종료 메시지
     */
    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ConferenceEnded {
        private final String type = "conference-ended";
        private final String conferenceId;
        private final String message;

        public static ConferenceEnded of(String conferenceId) {
            return ConferenceEnded.builder()
                    .conferenceId(conferenceId)
                    .message("세션이 종료되었습니다.")
                    .build();
        }
    }
}
