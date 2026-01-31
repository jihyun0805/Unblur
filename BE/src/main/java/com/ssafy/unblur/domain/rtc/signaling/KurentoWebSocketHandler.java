package com.ssafy.unblur.domain.rtc.signaling;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.common.service.event.WsEventType;
import com.ssafy.unblur.domain.match.model.VoteChoice;
import com.ssafy.unblur.domain.match.service.ConferenceLifecycleService;
import com.ssafy.unblur.domain.match.service.MatchEventPublisher;
import com.ssafy.unblur.domain.match.service.RoundVoteService;
import com.ssafy.unblur.domain.rtc.dto.event.SignalingMessages;
import com.ssafy.unblur.domain.rtc.model.UserSession;
import com.ssafy.unblur.domain.rtc.service.KurentoRoomService;
import com.ssafy.unblur.domain.rtc.service.RtcParticipantStore;
import com.ssafy.unblur.domain.rtc.service.RtcSessionStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kurento.client.IceCandidate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Kurento WebRTC 시그널링 핸들러
 * <p>
 * WebSocket 메시지를 수신해 등록, 룸 입장, SDP/ICE 교환을 처리한다.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class KurentoWebSocketHandler extends TextWebSocketHandler {

    /**
     * Kurento 룸 생성/입장/시그널링 처리를 담당하는 서비스
     */
    private final KurentoRoomService kurentoRoomService;

    /**
     * 회의 생명주기 서비스
     */
    private final ConferenceLifecycleService conferenceLifecycleService;

    /**
     * 매치 이벤트 발행자 (WebSocket 메시지 전송)
     */
    private final MatchEventPublisher matchEventPublisher;

    /**
     * 라운드 투표 처리 서비스
     */
    private final RoundVoteService roundVoteService;

    /**
     * WebSocket 세션 저장소
     */
    private final RtcSessionStore sessionStore;

    /**
     * RTC 참가자 저장소
     */
    private final RtcParticipantStore participantStore;

    /**
     * 시그널링 메시지 파싱/직렬화를 위한 JSON 매퍼
     */
    private final ObjectMapper objectMapper;

    /**
     * 세션별 메시지 전송 동기화용 락 맵
     */
    private final Map<String, Object> sessionLocks = new ConcurrentHashMap<>();

    /**
     * 텍스트 메시지를 수신해 type 값에 따라 처리기로 분기하는 메서드
     *
     * @param session WebSocket 세션
     * @param message 수신 메시지
     * @throws IOException 전송 중 오류
     */
    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        try {
            JsonNode payload = objectMapper.readTree(message.getPayload());
            String type = payload.get("type").asText();

            switch (type) {
                case "register" -> handleRegister(session, payload);
                case "join" -> handleJoin(session, payload);
                case "offer" -> handleOffer(session, payload);
                case "candidate" -> handleCandidate(session, payload);
                case "vote" -> handleVote(session, payload);
                case "leave" -> handleLeave(session, payload);
                default -> {
                    SignalingMessages.Error errorMessage = SignalingMessages.Error.builder()
                            .message("Unknown message type: " + type)
                            .build();

                    send(session, errorMessage);
                }
            }

        } catch (RuntimeException e) {
            log.error("WebSocket 처리 중 오류가 발생했습니다. sessionId={}", session.getId(), e);
            SignalingMessages.Error errorMessage = SignalingMessages.Error.builder()
                    .message("시그널링 처리 중 오류가 발생했습니다: " + e.getMessage())
                    .build();

            send(session, errorMessage);
        }
    }

    /**
     * WebSocket 연결이 성립되면 세션을 등록하는 메서드
     *
     * @param session WebSocket 세션
     */
    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("WebSocket 연결됨. sessionId={}, remote={}", session.getId(), session.getRemoteAddress());
        sessionStore.register(session);
    }

    /**
     * WebSocket 연결이 종료되면 세션 정보를 정리하는 메서드
     *
     * @param session WebSocket 세션
     * @param status  종료 상태
     */
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        log.info("WebSocket 종료. sessionId={}, code={}, reason={}", session.getId(), status.getCode(), status.getReason());

        // 세션 정보 조회
        String sessionId = session.getId();
        sessionLocks.remove(sessionId);

        // 룸 퇴장 처리
        sessionStore.getConferenceId(sessionId).ifPresent(conferenceId ->
                sessionStore.getUserId(sessionId).ifPresent(userId -> {
                    // 남아 있는 참가자에게 left 이벤트 브로드캐스트
                    notifyLeft(conferenceId, userId);

                    // 회의 생명주기 서비스에 퇴장 알림 (DB 기록)
                    conferenceLifecycleService.onLeave(conferenceId, userId);

                    // Kurento 룸 서비스에 퇴장 요청 (WebRTC 정리)
                    kurentoRoomService.leave(conferenceId, userId);
                })
        );

        // 세션 저장소에서 제거
        sessionStore.remove(sessionId);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.warn("WebSocket 전송 오류. sessionId={}", session.getId(), exception);
    }

    /**
     * 사용자 등록 메시지를 처리하는 메서드
     *
     * @param session WebSocket 세션
     * @param payload 요청 페이로드
     * @throws IOException 전송 중 오류
     */
    private void handleRegister(WebSocketSession session, JsonNode payload) throws IOException {
        // 사용자 ID 추출
        UUID userId = parseUuid(session, payload, "userId");
        if (userId == null) {
            return;
        }

        // 세션 정보 저장
        sessionStore.bindUser(session.getId(), userId);

        // 등록 완료 메시지 전송
        SignalingMessages.Registered registeredMessage = SignalingMessages.Registered.builder()
                .userId(userId.toString())
                .build();

        send(session, registeredMessage);
    }

    /**
     * 방 입장 요청을 처리하는 메서드
     *
     * @param session WebSocket 세션
     * @param payload 요청 페이로드
     * @throws IOException 전송 중 오류
     */
    private void handleJoin(WebSocketSession session, JsonNode payload) throws IOException {
        // 방 ID 및 사용자 ID 추출
        UUID conferenceId = parseUuid(session, payload, "conferenceId");
        UUID userId = parseUuid(session, payload, "userId");
        if (conferenceId == null || userId == null) {
            return;
        }

        sessionStore.bindUser(session.getId(), userId);
        sessionStore.bindConference(session.getId(), conferenceId);

        UserSession userSession;
        try {
            // Kurento 룸 서비스에 입장 요청 (WebRTC 설정)
            userSession = kurentoRoomService.join(conferenceId, userId);

            // 회의 생명주기 서비스에 입장 알림 (DB 기록 + 라운드 시작)
            conferenceLifecycleService.onJoin(conferenceId, userId);

        } catch (RuntimeException e) {
            // join 실패 시 세션 매핑/RTC 정리
            try {
                kurentoRoomService.leave(conferenceId, userId);

            } catch (Exception exception) {
                // 무시
            }

            sessionStore.remove(session.getId());
            throw e;
        }

        // ICE Candidate 이벤트 리스너 등록
        userSession.webRtcEndpoint().addIceCandidateFoundListener(event ->
                sendCandidate(session, event.getCandidate())
        );

        // 입장 완료 메시지 전송
        SignalingMessages.Joined joinedMessage = SignalingMessages.Joined.builder()
                .conferenceId(conferenceId.toString())
                .userId(userId.toString())
                .build();

        send(session, joinedMessage);
    }

    /**
     * SDP Offer를 처리하는 메서드
     *
     * @param session WebSocket 세션
     * @param payload 요청 페이로드
     * @throws IOException 전송 중 오류
     */
    private void handleOffer(WebSocketSession session, JsonNode payload) throws IOException {
        // 방 ID 및 사용자 ID 추출
        UUID conferenceId = parseUuid(session, payload, "conferenceId");
        UUID userId = parseUuid(session, payload, "userId");
        if (conferenceId == null || userId == null) {
            return;
        }

        // SDP Offer 처리 및 Answer 생성
        String sdpOffer = payload.get("sdpOffer").asText();
        String sdpAnswer = kurentoRoomService.processOffer(conferenceId, userId, sdpOffer);

        // Answer 메시지 전송
        SignalingMessages.Answer answerMessage = SignalingMessages.Answer.builder()
                .sdpAnswer(sdpAnswer)
                .build();

        send(session, answerMessage);
    }

    /**
     * ICE Candidate를 처리하는 메서드
     *
     * @param session WebSocket 세션
     * @param payload 요청 페이로드
     * @throws IOException 전송 중 오류
     */
    private void handleCandidate(WebSocketSession session, JsonNode payload) throws IOException {
        // 방 ID 및 사용자 ID 추출
        UUID conferenceId = parseUuid(session, payload, "conferenceId");
        UUID userId = parseUuid(session, payload, "userId");
        if (conferenceId == null || userId == null) {
            return;
        }

        // ICE Candidate 정보 추출
        JsonNode candidateNode = payload.get("candidate");
        if (candidateNode == null) {
            SignalingMessages.Error errorMessage = SignalingMessages.Error.builder()
                    .message("ICE candidate 정보가 필요합니다.")
                    .build();

            send(session, errorMessage);
            return;
        }

        // ICE Candidate 추가
        String candidate = candidateNode.get("candidate").asText();
        String sdpMid = candidateNode.get("sdpMid").asText();
        int sdpMLineIndex = candidateNode.get("sdpMLineIndex").asInt();

        // Kurento 룸 서비스에 ICE Candidate 전달
        kurentoRoomService.addIceCandidate(conferenceId, userId, new IceCandidate(candidate, sdpMid, sdpMLineIndex));
    }

    /**
     * 라운드 투표
     */
    private void handleVote(WebSocketSession session, JsonNode payload) throws IOException {
        // 방 ID 및 사용자 ID 추출
        UUID conferenceId = parseUuid(session, payload, "conferenceId");
        UUID userId = parseUuid(session, payload, "userId");
        if (conferenceId == null || userId == null) {
            return;
        }

        // 투표 값 추출 및 검증
        JsonNode voteNode = payload.get("vote");
        if (voteNode == null || voteNode.isNull()) {
            SignalingMessages.Error errorMessage = SignalingMessages.Error.builder()
                    .message("투표가 필요합니다.")
                    .build();

            send(session, errorMessage);
            return;
        }

        // 투표 처리
        String voteValue = voteNode.asText().toUpperCase();
        VoteChoice vote;
        try {
            vote = VoteChoice.valueOf(voteValue);

        } catch (IllegalArgumentException e) {
            SignalingMessages.Error errorMessage = SignalingMessages.Error.builder()
                    .message("올바르지 않은 투표 값입니다: " + voteValue)
                    .build();

            send(session, errorMessage);
            return;
        }

        // 라운드 투표 서비스에 투표 반영
        roundVoteService.processVote(conferenceId, userId, vote);

        // 투표 수신 메시지 전송
        SignalingMessages.VoteReceived voteReceivedMessage = SignalingMessages.VoteReceived.builder()
                .conferenceId(conferenceId.toString())
                .userId(userId.toString())
                .build();

        send(session, voteReceivedMessage);
    }

    /**
     * 세션 종료 요청을 처리하는 메서드
     *
     * @param session WebSocket 세션
     * @param payload 요청 페이로드
     * @throws IOException 전송 중 오류
     */
    private void handleLeave(WebSocketSession session, JsonNode payload) throws IOException {
        // 방 ID 및 사용자 ID 추출
        UUID conferenceId = parseUuid(session, payload, "conferenceId");
        UUID userId = parseUuid(session, payload, "userId");
        if (conferenceId == null || userId == null) {
            return;
        }

        // 남아 있는 참가자에게 left 이벤트 브로드캐스트
        notifyLeft(conferenceId, userId);

        // 회의 생명주기 서비스에 퇴장 알림 (DB 기록)
        conferenceLifecycleService.onLeave(conferenceId, userId);

        // Kurento 룸 서비스에 퇴장 요청 (WebRTC 정리)
        kurentoRoomService.leave(conferenceId, userId);

        // 퇴장 완료 메시지 전송
        SignalingMessages.Left leftMessage = SignalingMessages.Left.builder()
                .userId(userId.toString())
                .build();

        send(session, leftMessage);

        // 중복 전송 방지를 위해 세션 매핑 제거
        sessionStore.remove(session.getId());
    }

    /**
     * 남아 있는 참가자에게 left 이벤트를 브로드캐스트하는 메서드
     */
    private void notifyLeft(UUID conferenceId, UUID userId) {
        // 참가자 목록 조회
        List<UUID> participants = participantStore.getParticipantIds(conferenceId);
        if (participants.isEmpty()) {
            return;
        }

        // left 메시지 생성
        SignalingMessages.Left leftMessage = SignalingMessages.Left.builder()
                .userId(userId.toString())
                .build();

        // 참가자에게 left 이벤트 발송
        for (UUID participantId : participants) {
            if (!participantId.equals(userId)) {
                matchEventPublisher.publish(participantId, WsEventType.LEFT, leftMessage);
            }
        }
    }

    /**
     * ICE Candidate를 클라이언트로 전송하는 메서드
     *
     * @param session   WebSocket 세션
     * @param candidate ICE Candidate
     */
    private void sendCandidate(WebSocketSession session, IceCandidate candidate) {
        try {
            // ICE Candidate 메시지 생성 및 전송
            SignalingMessages.Candidate candidateMessage = SignalingMessages.Candidate.from(candidate);
            send(session, candidateMessage);

        } catch (IOException e) {
            log.error("ICE candidate 전송 실패. sessionId={}", session.getId(), e);
            throw new BaseException(ErrorCode.ICE_CANDIDATE_SEND_FAILED);
        }
    }

    /**
     * UUID 문자열을 파싱하는 메서드
     * <p>
     * 유효하지 않은 UUID 문자열이면 입력 문자열 기반의 name UUID로 변환해 반환한다.
     * </p>
     *
     * @param session WebSocket 세션
     * @param payload 요청 페이로드
     * @param field   필드명
     * @return UUID 또는 null(필드 누락)
     * @throws IOException 전송 중 오류
     */
    private UUID parseUuid(WebSocketSession session, JsonNode payload, String field) throws IOException {
        // 필드 추출 및 검증
        JsonNode node = payload.get(field);
        if (node == null || node.isNull()) {
            SignalingMessages.Error errorMessage = SignalingMessages.Error.builder()
                    .message(field + "가 필요합니다.")
                    .build();

            send(session, errorMessage);
            return null;
        }

        // UUID 파싱
        String raw = node.asText();
        try {
            return UUID.fromString(raw);

        } catch (IllegalArgumentException e) {
            return UUID.nameUUIDFromBytes(raw.getBytes(StandardCharsets.UTF_8));
        }
    }

    /**
     * 공통 메시지 전송을 처리하는 메서드
     * </p>
     * 세션별 lock을 통해 동시 전송 충돌을 방지한다.
     *
     * @param session WebSocket 세션
     * @param message 메시지
     * @throws IOException 전송 중 오류
     */
    private void send(WebSocketSession session, Object message) throws IOException {
        // 세션 열림 여부 확인
        if (!session.isOpen()) {
            return;
        }

        // 세션별 락을 통해 동시 전송 충돌 방지
        Object lock = sessionLocks.computeIfAbsent(session.getId(), id -> new Object());
        synchronized (lock) {
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(message))); // 메시지 전송
            }
        }
    }

}
