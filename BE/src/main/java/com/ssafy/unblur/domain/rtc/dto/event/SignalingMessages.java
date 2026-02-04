package com.ssafy.unblur.domain.rtc.dto.event;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
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
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Registered(
            String type,
            String userId
    ) {
        public Registered {
            if (type == null) {
                type = "registered";
            }
        }
    }

    /**
     * 방 입장 완료 메시지
     */
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Joined(
            String type,
            String conferenceId,
            String userId
    ) {
        public Joined {
            if (type == null) {
                type = "joined";
            }
        }
    }

    /**
     * SDP Answer 메시지
     */
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Answer(
            String type,
            String sdpAnswer
    ) {
        public Answer {
            if (type == null) {
                type = "answer";
            }
        }
    }

    /**
     * ICE Candidate 메시지
     */
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Candidate(
            String type,
            CandidateInfo candidate
    ) {
        public Candidate {
            if (type == null) {
                type = "candidate";
            }
        }

        @Builder
        public record CandidateInfo(
                String candidate,
                String sdpMid,
                int sdpMLineIndex
        ) {
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
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Left(
            String type,
            String userId
    ) {
        public Left {
            if (type == null) {
                type = "left";
            }
        }
    }

    /**
     * 투표 수신 확인 메시지
     */
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record VoteReceived(
            String type,
            String conferenceId,
            String userId
    ) {
        public VoteReceived {
            if (type == null) {
                type = "vote-received";
            }
        }
    }

    /**
     * 상대방 미디어 상태 (카메라/마이크 켜짐·꺼짐)
     */
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record MediaState(
            String type,
            String conferenceId,
            String userId,
            Boolean videoEnabled,
            Boolean audioMuted
    ) {
        public MediaState {
            if (type == null) {
                type = "media-state";
            }
        }

        public static MediaState of(String conferenceId, String userId, boolean videoEnabled, boolean audioMuted) {
            return MediaState.builder()
                    .conferenceId(conferenceId)
                    .userId(userId)
                    .videoEnabled(videoEnabled)
                    .audioMuted(audioMuted)
                    .build();
        }
    }

    /**
     * 오류 메시지
     */
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Error(
            String type,
            String message
    ) {
        public Error {
            if (type == null) {
                type = "error";
            }
        }
    }
}