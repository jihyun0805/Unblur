package com.ssafy.unblur.domain.rtc.service;

import com.ssafy.unblur.domain.rtc.model.UserSession;
import org.kurento.client.IceCandidate;

import java.util.UUID;

/**
 * Kurento 기반 1:1 화상 통신 방을 관리하는 서비스
 */
public interface KurentoRoomService {

    /**
     * 방에 사용자를 입장시키는 메서드
     *
     * @param conferenceId 방 ID
     * @param userId       사용자 ID
     * @return 사용자 세션
     */
    UserSession join(UUID conferenceId, UUID userId);

    // WebRTC 통신에서 SDP(Session Description Protocol)는 연결을 시도하는 두 기기가 서로의 미디어 정보와 연결 가능한 네트워크 후보 정보를 이해하기 위해 주고받는 텍스트 형식의 데이터이다.
    // 여기에는 미디어 정보(오디오/비디오 코덱, 해상도 등), 네트워크 후보 정보(IP, 포트 등), 기타 연결 설정 정보가 포함된다.
    //
    // WebRTC는 Offer / Answer 모델로 동작한다.
    // 한 쪽이 SDP Offer를 생성해 보내면, 받은 쪽은 이를 바탕으로 SDP Answer를 생성해 응답한다.
    // SDP Offer는 "나는 이런 코덱들을 지원하고, 이런 주소들로 연결 가능해. 연결할래?"라는 의미이고,
    // SDP Answer는 "좋아, 그중에서 이 설정으로 연결하자."라고 응답하는 것이다.

    /**
     * SDP Offer를 처리하고 Answer를 반환하는 메서드
     *
     * @param conferenceId 방 ID
     * @param userId       사용자 ID
     * @param sdpOffer     SDP Offer
     * @return SDP Answer
     */
    String processOffer(UUID conferenceId, UUID userId, String sdpOffer);

    // WebRTC 통신에서 ICE Candidate(Interactive Connectivity Establishment Candidate)는 두 기기가 서로에게 도달하기 위한 '네트워크 경로 후보'들을 의미한다.
    // 단순히 IP만 보내는 것이 아니라, 복잡한 네트워크 환경(공유기, 방화벽 등)을 뚫고 연결할 수 있는 모든 가능성(Candidate)을 찾아내어 상대방과 교환한다.

    // 주로 다음과 같은 세 가지 유형의 후보 정보를 포함한다:
    // 1. Host Candidate: 기기의 실제 사설 IP 주소 (같은 와이파이 환경 등에서 사용)
    // 2. Server Reflexive (srflx) Candidate: STUN 서버를 통해 알아낸 나의 공인 IP 주소
    // 3. Relay (relay) Candidate: 방화벽 등으로 직접 연결이 안 될 때, TURN 서버를 거쳐가는 우회 경로

    /**
     * ICE Candidate를 추가하는 메서드
     *
     * @param conferenceId 방 ID
     * @param userId       사용자 ID
     * @param candidate    ICE Candidate
     */
    void addIceCandidate(UUID conferenceId, UUID userId, IceCandidate candidate);

    /**
     * 방에서 사용자를 제거하는 메서드
     *
     * @param conferenceId 방 ID
     * @param userId       사용자 ID
     */
    void leave(UUID conferenceId, UUID userId);

}
