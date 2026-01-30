package com.ssafy.unblur.domain.rtc.dto.event;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

/**
 * 라운드/투표 관련 WebSocket 메시지 모음
 */
public final class RoundMessages {

    private RoundMessages() {
    }

    /**
     * 라운드 시간 종료 메시지
     */
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record RoundTimeUp(
            String type,
            String conferenceId,
            int roundNumber,
            String message
    ) {
        public RoundTimeUp {
            if (type == null) {
                type = "round-time-up";
            }
        }

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
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record PartnerVoted(
            String type,
            String conferenceId,
            String message
    ) {
        public PartnerVoted {
            if (type == null) {
                type = "partner-voted";
            }
        }

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
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record VoteConfirmRequest(
            String type,
            String conferenceId,
            String message
    ) {
        public VoteConfirmRequest {
            if (type == null) {
                type = "vote-confirm-request";
            }
        }

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
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record VoteWaitingConfirm(
            String type,
            String conferenceId,
            String message
    ) {
        public VoteWaitingConfirm {
            if (type == null) {
                type = "vote-waiting-confirm";
            }
        }

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
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record RoundStarted(
            String type,
            String conferenceId,
            int roundNumber,
            boolean isUnlimited
    ) {
        public RoundStarted {
            if (type == null) {
                type = "round-started";
            }
        }
    }

    /**
     * 세션 종료 메시지
     */
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ConferenceEnded(
            String type,
            String conferenceId,
            String message
    ) {
        public ConferenceEnded {
            if (type == null) {
                type = "conference-ended";
            }
        }

        public static ConferenceEnded of(String conferenceId) {
            return ConferenceEnded.builder()
                    .conferenceId(conferenceId)
                    .message("세션이 종료되었습니다.")
                    .build();
        }
    }
}