package com.ssafy.unblur.domain.rtc.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;
import org.kurento.client.IceCandidate;

/**
 * 시그널링 관련 WebSocket 메시지 모음
 */
public final class SignalingMessages {

    private SignalingMessages() {
    }

    /**
     * 사용자 등록 완료 메시지
     */
    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Registered {
        private final String type = "registered";
        private final String userId;
    }

    /**
     * 방 입장 완료 메시지
     */
    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Joined {
        private final String type = "joined";
        private final String conferenceId;
        private final String userId;
    }

    /**
     * SDP Answer 메시지
     */
    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Answer {
        private final String type = "answer";
        private final String sdpAnswer;
    }

    /**
     * ICE Candidate 메시지
     */
    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Candidate {
        private final String type = "candidate";
        private final CandidateInfo candidate;

        @Getter
        @Builder
        public static class CandidateInfo {
            private final String candidate;
            private final String sdpMid;
            private final int sdpMLineIndex;
        }

        public static Candidate from(IceCandidate iceCandidate) {
            return Candidate.builder()
                    .candidate(CandidateInfo.builder()
                            .candidate(iceCandidate.getCandidate())
                            .sdpMid(iceCandidate.getSdpMid())
                            .sdpMLineIndex(iceCandidate.getSdpMLineIndex())
                            .build())
                    .build();
        }
    }

    /**
     * 퇴장 완료 메시지
     */
    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Left {
        private final String type = "left";
        private final String userId;
    }

    /**
     * 투표 수신 확인 메시지
     */
    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class VoteReceived {
        private final String type = "vote-received";
        private final String conferenceId;
        private final String userId;
    }

    /**
     * 오류 메시지
     */
    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Error {
        private final String type = "error";
        private final String message;
    }
}
