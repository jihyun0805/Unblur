package com.ssafy.unblur.domain.rtc.service;

import com.ssafy.unblur.domain.rtc.model.UserSession;
import org.kurento.client.IceCandidate;
import org.springframework.web.socket.WebSocketSession;

import java.util.UUID;

/**
 * Kurento 기반 1:1 화상 통신 방을 관리하는 서비스
 */
public interface KurentoRoomService {

    /**
     * 방에 사용자를 입장시키는 메서드
     *
     * @param conferenceId 방 ID
     * @param userId 사용자 ID
     * @param session WebSocket 세션
     * @return 사용자 세션
     */
    UserSession join(UUID conferenceId, UUID userId, WebSocketSession session);

    /**
     * SDP Offer를 처리하고 Answer를 반환하는 메서드
     *
     * @param conferenceId 방 ID
     * @param userId 사용자 ID
     * @param sdpOffer SDP Offer
     * @return SDP Answer
     */
    String processOffer(UUID conferenceId, UUID userId, String sdpOffer);

    /**
     * ICE Candidate를 추가하는 메서드
     *
     * @param conferenceId 방 ID
     * @param userId 사용자 ID
     * @param candidate ICE Candidate
     */
    void addIceCandidate(UUID conferenceId, UUID userId, IceCandidate candidate);

    /**
     * 방에서 사용자를 제거하는 메서드
     *
     * @param conferenceId 방 ID
     * @param userId 사용자 ID
     */
    void leave(UUID conferenceId, UUID userId);

}
