package com.ssafy.unblur.domain.rtc.signaling;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.unblur.domain.rtc.exception.IceCandidateSendException;
import com.ssafy.unblur.domain.rtc.model.UserSession;
import com.ssafy.unblur.domain.rtc.service.KurentoRoomService;
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
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Kurento WebRTC 시그널링 핸들러
 * </p>
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
     * WebSocket 세션 저장소
     */
    private final RtcSessionStore sessionStore;

    /**
     * 시그널링 메시지 파싱/직렬화를 위한 JSON 매퍼
     */
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 세션별 참가 정보(방/사용자) 보관 맵
     */
    private final Map<String, SessionInfo> sessionInfos = new ConcurrentHashMap<>();

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
                case "leave" -> handleLeave(session, payload);
                default -> sendError(session, "Unknown message type: " + type);
            }

        } catch (RuntimeException e) {
            log.error("WebSocket 처리 중 오류가 발생했습니다. sessionId={}", session.getId(), e);
            sendError(session, "시그널링 처리 중 오류가 발생했습니다.");
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

        SessionInfo info = sessionInfos.remove(session.getId());
        sessionLocks.remove(session.getId());
        if (info != null) {
            if (info.conferenceId != null) {
                kurentoRoomService.leave(info.conferenceId, info.userId);
            }
        }

        sessionStore.remove(session.getId());
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
        UUID userId = parseUuid(session, payload, "userId");
        if (userId == null) {
            return;
        }
        sessionInfos.put(session.getId(), new SessionInfo(null, userId));
        sessionStore.bindUser(session.getId(), userId);
        sendMessage(session, Map.of(
                "type", "registered",
                "userId", userId.toString()
        ));
    }

    /**
     * 방 입장 요청을 처리하는 메서드
     *
     * @param session WebSocket 세션
     * @param payload 요청 페이로드
     * @throws IOException 전송 중 오류
     */
    private void handleJoin(WebSocketSession session, JsonNode payload) throws IOException {
        UUID conferenceId = parseUuid(session, payload, "conferenceId");
        UUID userId = parseUuid(session, payload, "userId");
        if (conferenceId == null || userId == null) {
            return;
        }

        UserSession userSession = kurentoRoomService.join(conferenceId, userId, session);
        sessionInfos.put(session.getId(), new SessionInfo(conferenceId, userId));
        sessionStore.bindUser(session.getId(), userId);

        userSession.webRtcEndpoint().addIceCandidateFoundListener(event -> {
            IceCandidate candidate = event.getCandidate();
            sendCandidate(session, candidate);
        });

        sendMessage(session, Map.of(
                "type", "joined",
                "conferenceId", conferenceId.toString(),
                "userId", userId.toString()
        ));
    }

    /**
     * SDP Offer를 처리하는 메서드
     *
     * @param session WebSocket 세션
     * @param payload 요청 페이로드
     * @throws IOException 전송 중 오류
     */
    private void handleOffer(WebSocketSession session, JsonNode payload) throws IOException {
        UUID conferenceId = parseUuid(session, payload, "conferenceId");
        UUID userId = parseUuid(session, payload, "userId");
        if (conferenceId == null || userId == null) {
            return;
        }

        String sdpOffer = payload.get("sdpOffer").asText();

        String sdpAnswer = kurentoRoomService.processOffer(conferenceId, userId, sdpOffer);
        sendMessage(session, Map.of(
                "type", "answer",
                "sdpAnswer", sdpAnswer
        ));
    }

    /**
     * ICE Candidate를 처리하는 메서드
     *
     * @param session WebSocket 세션
     * @param payload 요청 페이로드
     * @throws IOException 전송 중 오류
     */
    private void handleCandidate(WebSocketSession session, JsonNode payload) throws IOException {
        UUID conferenceId = parseUuid(session, payload, "conferenceId");
        UUID userId = parseUuid(session, payload, "userId");
        if (conferenceId == null || userId == null) {
            return;
        }

        JsonNode candidateNode = payload.get("candidate");
        if (candidateNode == null) {
            sendError(session, "Missing candidate");
            return;
        }

        String candidate = candidateNode.get("candidate").asText();
        String sdpMid = candidateNode.get("sdpMid").asText();
        int sdpMLineIndex = candidateNode.get("sdpMLineIndex").asInt();
        kurentoRoomService.addIceCandidate(conferenceId, userId, new IceCandidate(candidate, sdpMid, sdpMLineIndex));
    }

    /**
     * 통화 종료 요청을 처리하는 메서드
     *
     * @param session WebSocket 세션
     * @param payload 요청 페이로드
     * @throws IOException 전송 중 오류
     */
    private void handleLeave(WebSocketSession session, JsonNode payload) throws IOException {
        UUID conferenceId = parseUuid(session, payload, "conferenceId");
        UUID userId = parseUuid(session, payload, "userId");
        if (conferenceId == null || userId == null) {
            return;
        }

        kurentoRoomService.leave(conferenceId, userId);
        sendMessage(session, Map.of(
                "type", "left",
                "userId", userId.toString()
        ));
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
        JsonNode node = payload.get(field);
        if (node == null || node.isNull()) {
            sendError(session, field + "가 필요합니다.");
            return null;
        }

        String raw = node.asText();
        try {
            return UUID.fromString(raw);

        } catch (IllegalArgumentException e) {
            return UUID.nameUUIDFromBytes(raw.getBytes(StandardCharsets.UTF_8));
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
            sendMessage(session, Map.of(
                    "type", "candidate",
                    "candidate", Map.of(
                            "candidate", candidate.getCandidate(),
                            "sdpMid", candidate.getSdpMid(),
                            "sdpMLineIndex", candidate.getSdpMLineIndex()
                    )
            ));

        } catch (IOException e) {
            throw new IceCandidateSendException("Failed to send ICE candidate", e);
        }
    }

    /**
     * 오류 메시지를 전송하는 메서드
     *
     * @param session WebSocket 세션
     * @param message 오류 메시지
     * @throws IOException 전송 중 오류
     */
    private void sendError(WebSocketSession session, String message) throws IOException {
        sendMessage(session, Map.of("type", "error", "message", message));
    }

    /**
     * 공통 메시지 전송을 처리하는 메서드
     * </p>
     * 세션별 lock을 통해 동시 전송 충돌을 방지한다.
     *
     * @param session WebSocket 세션
     * @param payload 메시지 페이로드
     * @throws IOException 전송 중 오류
     */
    private void sendMessage(WebSocketSession session, Map<String, Object> payload) throws IOException {
        if (!session.isOpen()) {
            return;
        }

        Object lock = sessionLocks.computeIfAbsent(session.getId(), id -> new Object());
        synchronized (lock) {
            if (!session.isOpen()) {
                return;
            }

            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(payload)));
        }
    }

    /**
     * 세션별 사용자/방 정보를 담는 레코드
     *
     * @param conferenceId 방 ID
     * @param userId       사용자 ID
     */
    private record SessionInfo(UUID conferenceId, UUID userId) {
    }
}
