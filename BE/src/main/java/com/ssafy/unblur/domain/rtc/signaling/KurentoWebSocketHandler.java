package com.ssafy.unblur.domain.rtc.signaling;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.common.service.event.WsEventType;
import com.ssafy.unblur.domain.match.model.VoteChoice;
import com.ssafy.unblur.domain.match.service.ConferenceLifecycleService;
import com.ssafy.unblur.common.service.EventSender;
import com.ssafy.unblur.domain.match.service.RoundVoteService;
import com.ssafy.unblur.domain.match.service.BalanceGameService;
import com.ssafy.unblur.domain.rtc.dto.event.SignalingMessages;
import com.ssafy.unblur.domain.rtc.model.UserSession;
import com.ssafy.unblur.domain.rtc.service.KurentoRoomService;
import com.ssafy.unblur.domain.rtc.service.RtcParticipantStore;
import com.ssafy.unblur.domain.rtc.service.RtcSessionStore;
import com.ssafy.unblur.common.service.WebSocketMessageSender;
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
import java.util.UUID;

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
     * 이벤트 전송기 (WebSocket 메시지 전송)
     */
    private final EventSender eventSender;

    /**
     * 라운드 투표 처리 서비스
     */
    private final RoundVoteService roundVoteService;

    /**
     * 밸런스 게임 처리 서비스
     */
    private final BalanceGameService balanceGameService;

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
     * WebSocket 메시지 전송기
     */
    private final WebSocketMessageSender webSocketMessageSender;

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
                case "balance-invite" -> handleBalanceInvite(session, payload);
                case "balance-response" -> handleBalanceResponse(session, payload);
                case "balance-select" -> handleBalanceSelect(session, payload);
                case "vote" -> handleVote(session, payload);
                case "round-skip" -> handleRoundSkip(session, payload);
                case "round-skip-accept" -> handleRoundSkipAccept(session, payload);
                case "round-skip-decline" -> handleRoundSkipDecline(session, payload);
                case "leave" -> handleLeave(session, payload);
                default -> {
                    SignalingMessages.Error errorMessage = SignalingMessages.Error.builder()
                            .message("Unknown message type: " + type)
                            .build();

                    webSocketMessageSender.send(session, errorMessage);
                }
            }

        } catch (RuntimeException e) {
            log.error("WebSocket 처리 중 오류가 발생했습니다. sessionId={}", session.getId(), e);
            SignalingMessages.Error errorMessage = SignalingMessages.Error.builder()
                    .message("시그널링 처리 중 오류가 발생했습니다: " + e.getMessage())
                    .build();

            webSocketMessageSender.send(session, errorMessage);
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
        webSocketMessageSender.release(sessionId);

        // 재연결 시 "이전 세션"이 늦게 닫히는 경우가 있어, 최신 세션이 있는지 확인한 뒤에만 퇴장 처리를 수행한다.

        // 세션에 바인딩된 사용자 ID 조회
        UUID boundUserId = sessionStore.getUserId(sessionId).orElse(null);
        if (boundUserId != null) {
            // 현재 사용자 기준으로 최신 세션 조회
            String currentSessionId = sessionStore.findSessionIdByUser(boundUserId).orElse(null);

            // 현재 세션 ID가 존재하고, 이것이 종료된 세션 ID와 다르면 stale 세션으로 간주
            if (currentSessionId != null && !currentSessionId.equals(sessionId)) {
                log.info("오래된 WebSocket 종료 감지. sessionId={}, userId={}, currentSessionId={}", sessionId, boundUserId, currentSessionId);

                // 오래된 세션은 컨퍼런스 퇴장 처리 없이 매핑만 정리
                sessionStore.remove(sessionId);
                return;
            }
        }

        // 룸 퇴장 처리
        sessionStore.getConferenceId(sessionId).ifPresent(conferenceId ->
                sessionStore.getUserId(sessionId).ifPresent(sessionUserId -> {
                    // 남아 있는 참가자에게 left 이벤트 브로드캐스트
                    notifyLeft(conferenceId, sessionUserId);

                    // 회의 생명주기 서비스에 퇴장 알림 (DB 기록)
                    conferenceLifecycleService.onLeave(conferenceId, sessionUserId);

                    // Kurento 룸 서비스에 퇴장 요청 (WebRTC 정리)
                    kurentoRoomService.leave(conferenceId, sessionUserId);
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

        webSocketMessageSender.send(session, registeredMessage);
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

        // 세션-사용자 일치 검증
        if (!validateSessionUserForJoin(session, userId)) {
            return;
        }

        log.info("RTC 방 입장 요청. sessionId={}, conferenceId={}, userId={}", session.getId(), conferenceId, userId);

        sessionStore.bindUser(session.getId(), userId);
        sessionStore.bindConference(session.getId(), conferenceId);

        UserSession userSession;
        try {
            // Kurento 룸 서비스에 입장 요청 (WebRTC 설정)
            userSession = kurentoRoomService.join(conferenceId, userId);

            // 회의 생명주기 서비스에 입장 알림 (DB 기록 + 라운드 시작)
            conferenceLifecycleService.onJoin(conferenceId, userId);

            log.info("RTC 방 입장 완료. sessionId={}, conferenceId={}, userId={}", session.getId(), conferenceId, userId);

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

        webSocketMessageSender.send(session, joinedMessage);
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

        // 세션-사용자 일치 검증
        if (isInvalidSessionUser(session, userId)) {
            return;
        }

        // SDP Offer 처리 및 Answer 생성
        String sdpOffer = payload.get("sdpOffer").asText();
        String sdpAnswer = kurentoRoomService.processOffer(conferenceId, userId, sdpOffer);

        // Answer 메시지 전송
        SignalingMessages.Answer answerMessage = SignalingMessages.Answer.builder()
                .sdpAnswer(sdpAnswer)
                .build();

        webSocketMessageSender.send(session, answerMessage);
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

        // 세션-사용자 일치 검증
        if (isInvalidSessionUser(session, userId)) {
            return;
        }

        // ICE Candidate 정보 추출
        JsonNode candidateNode = payload.get("candidate");
        if (candidateNode == null) {
            SignalingMessages.Error errorMessage = SignalingMessages.Error.builder()
                    .message("ICE candidate 정보가 필요합니다.")
                    .build();

            webSocketMessageSender.send(session, errorMessage);
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
     * 밸런스 게임 초대 요청하는 메서드
     *
     * @param session WebSocket 세션
     * @param payload 요청 페이로드
     * @throws IOException 전송 중 오류
     */
    private void handleBalanceInvite(WebSocketSession session, JsonNode payload) throws IOException {
        // 방 ID 및 사용자 ID 추출
        UUID conferenceId = parseUuid(session, payload, "conferenceId");
        UUID userId = parseUuid(session, payload, "userId");
        if (conferenceId == null || userId == null) {
            return;
        }

        // 세션-사용자 일치 검증
        if (isInvalidSessionUser(session, userId)) {
            return;
        }

        // 밸런스 게임 초대 처리
        balanceGameService.invite(conferenceId, userId);
    }

    /**
     * 밸런스 게임 초대 응답 처리하는 메서드
     *
     * @param session WebSocket 세션
     * @param payload 요청 페이로드
     * @throws IOException 전송 중 오류
     */
    private void handleBalanceResponse(WebSocketSession session, JsonNode payload) throws IOException {
        // 방 ID 및 사용자 ID 추출
        UUID conferenceId = parseUuid(session, payload, "conferenceId");
        UUID userId = parseUuid(session, payload, "userId");
        if (conferenceId == null || userId == null) {
            return;
        }

        // 세션-사용자 일치 검증
        if (isInvalidSessionUser(session, userId)) {
            return;
        }

        // 응답 값 추출 및 검증
        JsonNode acceptedNode = payload.get("accepted");
        if (acceptedNode == null || acceptedNode.isNull()) {
            // 에러 메시지 생성
            SignalingMessages.Error errorMessage = SignalingMessages.Error.builder()
                    .message("응답 여부(accepted)가 필요합니다.")
                    .build();

            // 응답 메시지 전송
            webSocketMessageSender.send(session, errorMessage);
            return;
        }

        // 밸런스 게임 응답 처리
        balanceGameService.respond(conferenceId, userId, acceptedNode.asBoolean());
    }

    /**
     * 밸런스 게임 선택하는 메서드
     *
     * @param session WebSocket 세션
     * @param payload 요청 페이로드
     * @throws IOException 전송 중 오류
     */
    private void handleBalanceSelect(WebSocketSession session, JsonNode payload) throws IOException {
        // 방 ID 및 사용자 ID 추출
        UUID conferenceId = parseUuid(session, payload, "conferenceId");
        UUID userId = parseUuid(session, payload, "userId");
        if (conferenceId == null || userId == null) {
            return;
        }

        // 세션-사용자 일치 검증
        if (isInvalidSessionUser(session, userId)) {
            return;
        }

        // 선택 값 추출 및 검증
        JsonNode choiceNode = payload.get("choice");
        if (choiceNode == null || choiceNode.isNull()) {
            // 에러 메시지 생성
            SignalingMessages.Error errorMessage = SignalingMessages.Error.builder()
                    .message("선택 값(choice)이 필요합니다.")
                    .build();

            // 응답 메시지 전송
            webSocketMessageSender.send(session, errorMessage);
            return;
        }

        // 밸런스 게임 선택 처리
        balanceGameService.select(conferenceId, userId, choiceNode.asText());
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

        // 세션-사용자 일치 검증
        if (isInvalidSessionUser(session, userId)) {
            return;
        }

        // 투표 값 추출 및 검증
        JsonNode voteNode = payload.get("vote");
        if (voteNode == null || voteNode.isNull()) {
            SignalingMessages.Error errorMessage = SignalingMessages.Error.builder()
                    .message("투표가 필요합니다.")
                    .build();

            webSocketMessageSender.send(session, errorMessage);
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

            webSocketMessageSender.send(session, errorMessage);
            return;
        }

        // 라운드 투표 서비스에 투표 반영
        roundVoteService.processVote(conferenceId, userId, vote);

        // 투표 수신 메시지 전송
        SignalingMessages.VoteReceived voteReceivedMessage = SignalingMessages.VoteReceived.builder()
                .conferenceId(conferenceId.toString())
                .userId(userId.toString())
                .build();

        webSocketMessageSender.send(session, voteReceivedMessage);
    }

    /**
     * 라운드 스킵 요청을 처리하는 메서드
     *
     * @param session WebSocket 세션
     * @param payload 요청 페이로드
     * @throws IOException 전송 중 오류
     */
    private void handleRoundSkip(WebSocketSession session, JsonNode payload) throws IOException {
        // 방 ID 및 사용자 ID 추출
        UUID conferenceId = parseUuid(session, payload, "conferenceId");
        UUID userId = parseUuid(session, payload, "userId");
        if (conferenceId == null || userId == null) {
            return;
        }

        // 세션-사용자 일치 검증
        if (isInvalidSessionUser(session, userId)) {
            return;
        }

        // 라운드 스킵 요청 처리
        roundVoteService.requestSkip(conferenceId, userId);
    }

    /**
     * 라운드 스킵 수락 요청을 처리하는 메서드
     *
     * @param session WebSocket 세션
     * @param payload 요청 페이로드
     * @throws IOException 전송 중 오류
     */
    private void handleRoundSkipAccept(WebSocketSession session, JsonNode payload) throws IOException {
        // 방 ID 및 사용자 ID 추출
        UUID conferenceId = parseUuid(session, payload, "conferenceId");
        UUID userId = parseUuid(session, payload, "userId");
        if (conferenceId == null || userId == null) {
            return;
        }

        // 세션-사용자 일치 검증
        if (isInvalidSessionUser(session, userId)) {
            return;
        }

        // 라운드 스킵 수락 처리
        roundVoteService.acceptSkip(conferenceId, userId);
    }

    /**
     * 라운드 스킵 거절 요청을 처리하는 메서드
     *
     * @param session WebSocket 세션
     * @param payload 요청 페이로드
     * @throws IOException 전송 중 오류
     */
    private void handleRoundSkipDecline(WebSocketSession session, JsonNode payload) throws IOException {
        // 방 ID 및 사용자 ID 추출
        UUID conferenceId = parseUuid(session, payload, "conferenceId");
        UUID userId = parseUuid(session, payload, "userId");
        if (conferenceId == null || userId == null) {
            return;
        }

        // 세션-사용자 일치 검증
        if (isInvalidSessionUser(session, userId)) {
            return;
        }

        // 라운드 스킵 거절 처리
        roundVoteService.declineSkip(conferenceId, userId);
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

        // 세션-사용자 일치 검증
        if (isInvalidSessionUser(session, userId)) {
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

        webSocketMessageSender.send(session, leftMessage);

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
                eventSender.publish(participantId, WsEventType.LEFT, leftMessage);
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
            webSocketMessageSender.send(session, candidateMessage);

        } catch (IOException e) {
            log.error("ICE candidate 전송 실패. sessionId={}", session.getId(), e);
            throw new BaseException(ErrorCode.ICE_CANDIDATE_SEND_FAILED);
        }
    }

    /**
     * 세션-사용자 일치 검증하는 메서드 (조인 전용)
     *
     * @param session WebSocket 세션
     * @param userId  사용자 ID
     * @return 일치하면 true, 불일치하면 false
     * @throws IOException 전송 중 오류
     */
    private boolean validateSessionUserForJoin(WebSocketSession session, UUID userId) throws IOException {
        // 세션에 바인딩된 사용자 ID 조회
        UUID boundUserId = sessionStore.getUserId(session.getId()).orElse(null);

        // 세션에 바인딩된 사용자 ID가 존재하나 페이로드의 사용자 ID와 일치하지 않는 경우
        if (boundUserId != null && !boundUserId.equals(userId)) {
            // 에러 메시지 생성
            SignalingMessages.Error errorMessage = SignalingMessages.Error.builder()
                    .message("세션 사용자 정보가 일치하지 않습니다.")
                    .build();

            // 에러 메시지 전송
            webSocketMessageSender.send(session, errorMessage);

            log.warn("WebSocket 세션-사용자 불일치(조인). sessionId={}, payloadUserId={}, boundUserId={}", session.getId(), userId, boundUserId);
            return false;
        }

        return true;
    }

    /**
     * 세션-사용자 일치 검증하는 메서드
     *
     * @param session WebSocket 세션
     * @param userId  사용자 ID
     * @return 일치하면 true, 불일치하면 false
     * @throws IOException 전송 중 오류
     */
    private boolean isInvalidSessionUser(WebSocketSession session, UUID userId) throws IOException {
        // 세션에 바인딩된 사용자 ID 조회
        UUID boundUserId = sessionStore.getUserId(session.getId()).orElse(null);

        // 세션에 사용자 정보가 없는 경우
        if (boundUserId == null) {
            // 에러 메시지 생성
            SignalingMessages.Error errorMessage = SignalingMessages.Error.builder()
                    .message("세션 사용자 정보가 없습니다.")
                    .build();

            // 에러 메시지 전송
            webSocketMessageSender.send(session, errorMessage);

            log.warn("WebSocket 세션 사용자 없음. sessionId={}, payloadUserId={}", session.getId(), userId);
            return true;
        }

        // 세션에 바인딩된 사용자 ID와 페이로드의 사용자 ID가 일치하지 않는 경우
        if (!boundUserId.equals(userId)) {
            // 에러 메시지 생성
            SignalingMessages.Error errorMessage = SignalingMessages.Error.builder()
                    .message("세션 사용자 정보가 일치하지 않습니다.")
                    .build();

            // 에러 메시지 전송
            webSocketMessageSender.send(session, errorMessage);

            log.warn("WebSocket 세션-사용자 불일치. sessionId={}, payloadUserId={}, boundUserId={}", session.getId(), userId, boundUserId);
            return true;
        }

        return false;
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

            webSocketMessageSender.send(session, errorMessage);
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

}
