package com.ssafy.unblur.domain.rtc.service.impl;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.domain.match.service.ConferenceLifecycleService;
import com.ssafy.unblur.domain.rtc.config.KurentoClientProvider;
import com.ssafy.unblur.domain.rtc.model.UserSession;
import com.ssafy.unblur.domain.rtc.service.KurentoRoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kurento.client.IceCandidate;
import org.kurento.client.KurentoClient;
import org.kurento.client.MediaPipeline;
import org.kurento.client.WebRtcEndpoint;
import org.kurento.jsonrpc.JsonRpcClientClosedException;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ConcurrentHashMap 기반 Kurento 방 관리 구현체
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InMemoryKurentoRoomService implements KurentoRoomService {

    /**
     * Kurento 클라이언트 제공자
     */
    private final KurentoClientProvider kurentoClientProvider;

    /**
     * 회의 생명주기 서비스
     */
    private final ConferenceLifecycleService conferenceLifecycleService;

    /**
     * 방 정보 저장소
     */
    private final Map<UUID, Room> rooms = new ConcurrentHashMap<>();

    @Override
    public UserSession join(UUID conferenceId, UUID userId, WebSocketSession session) {
        // 방이 없으면 새로 생성하고, 있으면 기존 방을 사용
        Room room = rooms.computeIfAbsent(conferenceId, this::createRoom);
        UserSession userSession = room.join(userId, session);

        try {
            conferenceLifecycleService.onJoin(conferenceId, userId);
            return userSession;

        } catch (RuntimeException e) {
            room.leave(userId);

            if (room.isEmpty()) {
                rooms.remove(conferenceId);
                room.release();
            }

            throw e;
        }
    }

    @Override
    public String processOffer(UUID conferenceId, UUID userId, String sdpOffer) {
        Room room = getRoom(conferenceId);
        return room.processOffer(userId, sdpOffer);
    }

    @Override
    public void addIceCandidate(UUID conferenceId, UUID userId, IceCandidate candidate) {
        Room room = getRoom(conferenceId);
        room.addIceCandidate(userId, candidate);
    }

    @Override
    public void leave(UUID conferenceId, UUID userId) {
        conferenceLifecycleService.onLeave(conferenceId, userId);

        Room room = rooms.get(conferenceId);
        if (room == null) {
            return;
        }

        room.leave(userId);
        if (room.isEmpty()) {
            rooms.remove(conferenceId);
            room.release();
        }
    }

    /**
     * 방 정보를 조회하는 메서드
     *
     * @param conferenceId 방 ID
     * @return 방 객체
     */
    private Room getRoom(UUID conferenceId) {
        Room room = rooms.get(conferenceId);
        if (room == null) {
            log.warn("존재하지 않는 RTC 방 접근 시도. conferenceId={}", conferenceId);
            throw new BaseException(ErrorCode.CONFERENCE_NOT_FOUND);
        }

        return room;
    }

    /**
     * 새로운 방을 생성하는 메서드
     *
     * @param conferenceId 방 ID
     * @return 방 객체
     */
    private Room createRoom(UUID conferenceId) {
        try {
            return new Room(kurentoClientProvider.get(), conferenceId);

        } catch (JsonRpcClientClosedException e) {
            return new Room(kurentoClientProvider.recreate(), conferenceId);
        }
    }

    /**
     * Kurento 기반 방 내부 구조.
     */
    @Slf4j
    private static class Room {
        private final UUID conferenceId;
        private final MediaPipeline pipeline;
        private final Map<UUID, UserSession> participants = new ConcurrentHashMap<>();

        /**
         * 방 생성자
         *
         * @param kurentoClient Kurento 클라이언트
         * @param conferenceId  방 ID
         */
        Room(KurentoClient kurentoClient, UUID conferenceId) {
            this.conferenceId = conferenceId;
            this.pipeline = kurentoClient.createMediaPipeline();
            log.info("RTC 방 생성. conferenceId={}", conferenceId);
        }

        /**
         * 사용자 입장을 처리하는 메서드
         *
         * @param userId  사용자 ID
         * @param session WebSocket 세션
         * @return 사용자 세션
         */
        UserSession join(UUID userId, WebSocketSession session) {
            WebRtcEndpoint endpoint = new WebRtcEndpoint.Builder(pipeline).build();
            UserSession userSession = new UserSession(userId, session, endpoint);
            participants.put(userId, userSession);
            log.info("RTC 사용자 입장. conferenceId={}, userId={}, size={}", conferenceId, userId, participants.size());
            return userSession;
        }

        /**
         * SDP Offer를 처리하고 Answer를 반환하는 메서드
         *
         * @param userId   사용자 ID
         * @param sdpOffer SDP Offer
         * @return SDP Answer
         */
        String processOffer(UUID userId, String sdpOffer) {
            UserSession userSession = getUserSession(userId);
            String sdpAnswer = userSession.webRtcEndpoint().processOffer(sdpOffer);
            userSession.webRtcEndpoint().gatherCandidates();

            // 1:1 연결을 위해 상대방과 양방향으로 연결
            for (UserSession other : participants.values()) {
                if (!other.userId().equals(userId)) {
                    userSession.webRtcEndpoint().connect(other.webRtcEndpoint());
                    other.webRtcEndpoint().connect(userSession.webRtcEndpoint());
                }
            }
            return sdpAnswer;
        }

        /**
         * ICE Candidate를 추가하는 메서드
         *
         * @param userId    사용자 ID
         * @param candidate ICE Candidate
         */
        void addIceCandidate(UUID userId, IceCandidate candidate) {
            UserSession userSession = getUserSession(userId);
            userSession.webRtcEndpoint().addIceCandidate(candidate);
        }

        /**
         * 방에서 사용자를 제거하는 메서드
         *
         * @param userId 사용자 ID
         */
        void leave(UUID userId) {
            UserSession userSession = participants.remove(userId);

            if (userSession != null) {
                userSession.webRtcEndpoint().release();
                log.info("RTC 사용자 퇴장. conferenceId={}, userId={}, size={}", conferenceId, userId, participants.size());
            }
        }

        /**
         * 방이 비었는지 확인하는 메서드
         *
         * @return 비었으면 true
         */
        boolean isEmpty() {
            return participants.isEmpty();
        }

        /**
         * 리소스를 해제하는 메서드
         */
        void release() {
            pipeline.release();
            log.info("RTC 방 해제. conferenceId={}", conferenceId);
        }

        /**
         * 사용자 세션을 조회하는 메서드
         *
         * @param userId 사용자 ID
         * @return 사용자 세션
         */
        private UserSession getUserSession(UUID userId) {
            UserSession userSession = participants.get(userId);
            if (userSession == null) {
                throw new BaseException(ErrorCode.USER_NOT_JOINED);
            }

            return userSession;
        }
    }
}
