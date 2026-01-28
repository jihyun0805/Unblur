package com.ssafy.unblur.domain.match.service.impl;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.domain.auth.model.Gender;
import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.auth.repository.UserRepository;
import com.ssafy.unblur.domain.match.config.MatchConfig.MatchPolicy;
import com.ssafy.unblur.domain.match.dto.*;
import com.ssafy.unblur.domain.match.model.*;
import com.ssafy.unblur.domain.match.model.event.SseMatchEventType;
import com.ssafy.unblur.domain.match.repository.ConferenceParticipantRepository;
import com.ssafy.unblur.domain.match.repository.ConferenceRepository;
import com.ssafy.unblur.domain.match.service.MatchEventPublisher;
import com.ssafy.unblur.domain.match.service.MatchQueueStore;
import com.ssafy.unblur.domain.match.service.MatchService;
import com.ssafy.unblur.domain.match.service.MatchSseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;

/**
 * 빠른 매칭 처리 서비스 구현체
 * <p>
 * 인메모리 대기열 기반이며 단일 인스턴스 환경을 전제로 한다.
 * 즉시 매칭은 서비스에서 처리하고, 단계(완화/타임아웃/배치) 처리는 프로세서에 위임한다.
 */
@Service
@RequiredArgsConstructor
public class MatchServiceImpl implements MatchService {

    /**
     * 매칭 대기열 저장소
     */
    private final MatchQueueStore queueStore;

    /**
     * 사용자 조회 레포지토리
     */
    private final UserRepository userRepository;

    /**
     * 매칭 대기열 처리 컴포넌트
     */
    private final MatchQueueProcessor queueProcessor;

    /**
     * 매칭 상태 알림 전송기
     */
    private final MatchEventPublisher eventPublisher;

    /**
     * SSE 서비스 (연결 상태 조회용)
     */
    private final MatchSseService sseService;

    /**
     * 매칭 정책 설정값
     */
    private final MatchPolicy policy;

    /**
     * 기준 시각 제공용 Clock
     */
    private final Clock clock;

    /**
     * 컨퍼런스 저장 레포지토리
     */
    private final ConferenceRepository conferenceRepository;

    /**
     * 세션 참여자 저장 레포지토리
     */
    private final ConferenceParticipantRepository participantRepository;

    /**
     * 빠른 매칭 요청을 대기열에 등록하고 즉시 매칭을 시도하는 메서드
     *
     * @param userId  사용자 ID
     * @param request 요청 DTO
     * @return 대기열 상태
     */
    @Override
    @Transactional
    public MatchingQueueResponse startQuickMatch(UUID userId, FastMatchingRequest request) {
        // 동일 사용자가 이미 대기 중이면 중복 등록 방지
        if (queueStore.existsWaiting(userId, MatchQueueType.QUICK)) {
            throw new BaseException(ErrorCode.MATCH_ALREADY_QUEUED);
        }

        // 요청자 기본 정보 조회(없으면 매칭 불가)
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        // 대기열 항목 생성 및 등록(요청 시점 스냅샷)
        MatchQueueItem item = MatchQueueItem.builder()
                .requestId(UUID.randomUUID())
                .requesterUserId(userId)
                .queueType(MatchQueueType.QUICK)
                .createdAt(LocalDateTime.now(clock))
                .filters(request.getFilters())
                .build();

        queueStore.save(item);

        // 즉시 매칭 1회 시도
        boolean matched = queueProcessor.tryImmediateMatch(item, user);

        MatchingQueueResponse response = buildResponse(item);

        if (!matched) {
            eventPublisher.publish(userId, SseMatchEventType.QUICK_WAITING, response);
        }

        return response;
    }

    /**
     * 빠른 매칭 응답을 구성하는 메서드
     *
     * @param item 대기열 항목
     * @return 응답 DTO
     */
    private MatchingQueueResponse buildResponse(MatchQueueItem item) {
        // 현재 대기열 기준으로 순번/대기시간을 계산
        List<MatchQueueItem> waiting = queueStore.findWaitingByType(MatchQueueType.QUICK);
        int waitingCount = waiting.size();

        Integer position = null;
        Integer estimatedWaitSeconds = null;
        boolean isQueued = item.getStatus() == MatchQueueStatus.WAITING;

        if (isQueued) {
            int index = -1;
            for (int i = 0; i < waiting.size(); i++) {
                if (waiting.get(i).getRequestId().equals(item.getRequestId())) {
                    index = i;
                    break;
                }
            }

            if (index >= 0) {
                position = index + 1;
                // 평균 대기 시간을 기준으로 단순 추정
                estimatedWaitSeconds = position * policy.averageWaitSeconds();
            }
        }

        return MatchingQueueResponse.builder()
                .requestId(item.getRequestId().toString())
                .status(item.getStatus().name().toLowerCase())
                .isQueued(isQueued)
                .position(position)
                .estimatedWaitSeconds(estimatedWaitSeconds)
                .queueType(item.getQueueType().name().toLowerCase())
                .waitingCount(waitingCount)
                .queuedAt(item.getCreatedAt())
                .build();
    }

    /**
     * 빠른 매칭을 취소하는 메서드
     *
     * @param userId    사용자 ID
     * @param requestId 매칭 요청 ID
     */
    @Override
    public void cancelQuickMatch(UUID userId, String requestId) {
        UUID parsedRequestId;
        try {
            parsedRequestId = UUID.fromString(requestId);
        } catch (IllegalArgumentException e) {
            throw new BaseException(ErrorCode.MATCH_REQUEST_NOT_FOUND);
        }

        MatchQueueItem item = queueStore.findByRequestId(parsedRequestId)
                .orElseThrow(() -> new BaseException(ErrorCode.MATCH_REQUEST_NOT_FOUND));

        // 본인의 요청인지 확인
        if (!item.getRequesterUserId().equals(userId)) {
            throw new BaseException(ErrorCode.MATCH_REQUEST_NOT_FOUND);
        }

        // 대기 중인 상태에서만 취소 가능
        if (!item.isWaiting()) {
            throw new BaseException(ErrorCode.MATCH_ALREADY_HANDLED);
        }

        item.markCanceled();

        // SSE 취소 이벤트 전송
        QuickMatchStageEvent event = QuickMatchStageEvent.builder()
                .requestId(requestId)
                .stage("canceled")
                .occurredAt(LocalDateTime.now(clock))
                .build();

        eventPublisher.publish(userId, SseMatchEventType.QUICK_CANCELED, event);
    }

    /**
     * 매칭 대기 상태를 조회하는 메서드
     *
     * @param userId 사용자 ID
     * @return 대기열 상태 (대기 중인 요청이 없으면 null)
     */
    @Override
    public MatchingQueueResponse getQueueStatus(UUID userId) {
        return queueStore.findByUserId(userId, MatchQueueType.QUICK)
                .map(this::buildResponse)
                .orElse(null);
    }

    /**
     * 1:1 매칭 요청을 처리하는 메서드
     *
     * @param userId  요청자 사용자 ID
     * @param request 1:1 매칭 요청 DTO
     * @return 1:1 매칭 응답
     */
    @Override
    @Transactional
    public OneOnOneMatchResponse startOneOnOneMatch(UUID userId, OneOnOneMatchRequest request) {
        UUID targetUserId;
        try {
            targetUserId = UUID.fromString(request.getTargetUserId());
        } catch (IllegalArgumentException e) {
            throw new BaseException(ErrorCode.MATCH_TARGET_NOT_FOUND);
        }

        // 자기 자신에게 매칭 요청 불가
        if (userId.equals(targetUserId)) {
            throw new BaseException(ErrorCode.INVALID_INPUT_VALUE);
        }

        // 동일 사용자가 이미 대기 중이면 중복 등록 방지
        if (queueStore.existsWaiting(userId, MatchQueueType.ONE_ON_ONE)) {
            throw new BaseException(ErrorCode.MATCH_ALREADY_QUEUED);
        }

        // 대상 사용자가 온라인인지 확인
        if (!sseService.isUserConnected(targetUserId)) {
            throw new BaseException(ErrorCode.MATCH_TARGET_OFFLINE);
        }

        LocalDateTime now = LocalDateTime.now(clock);

        // 대기열 항목 생성 및 등록
        MatchQueueItem item = MatchQueueItem.builder()
                .requestId(UUID.randomUUID())
                .requesterUserId(userId)
                .recipientUserId(targetUserId)
                .queueType(MatchQueueType.ONE_ON_ONE)
                .createdAt(now)
                .filters(Map.of())
                .build();

        queueStore.save(item);

        // 대상 사용자에게 알림 전송
        OneOnOneMatchResponse response = buildOneOnOneResponse(item, "pending");
        eventPublisher.publish(targetUserId, SseMatchEventType.ONE_ON_ONE_REQUESTED, response);

        return response;
    }

    /**
     * 1:1 매칭 요청을 수락하는 메서드
     *
     * @param userId    수신자 사용자 ID
     * @param requestId 매칭 요청 ID
     * @return 1:1 매칭 응답
     */
    @Override
    @Transactional
    public OneOnOneMatchResponse acceptOneOnOneMatch(UUID userId, String requestId) {
        UUID parsedRequestId = parseRequestId(requestId);

        MatchQueueItem item = queueStore.findByRequestId(parsedRequestId)
                .orElseThrow(() -> new BaseException(ErrorCode.MATCH_REQUEST_NOT_FOUND));

        // 수신자 본인인지 확인
        if (!item.getRecipientUserId().equals(userId)) {
            throw new BaseException(ErrorCode.MATCH_REQUEST_NOT_FOUND);
        }

        // 대기 중인 상태에서만 수락 가능
        if (!item.isWaiting()) {
            throw new BaseException(ErrorCode.MATCH_ALREADY_HANDLED);
        }

        // 요청자와 수신자 정보 조회
        User requester = userRepository.findById(item.getRequesterUserId())
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));
        User recipient = userRepository.findById(userId)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        // 매칭 완료 처리
        LocalDateTime matchedAt = LocalDateTime.now(clock);
        item.markMatched(matchedAt);

        // 컨퍼런스 생성
        Conference conference = createConference(requester, recipient);

        // 양쪽에 매칭 완료 이벤트 전송
        OneOnOneMatchResponse requesterResponse = buildOneOnOneMatchedResponse(item, conference, "accepted");
        OneOnOneMatchResponse recipientResponse = buildOneOnOneMatchedResponse(item, conference, "accepted");

        eventPublisher.publish(item.getRequesterUserId(), SseMatchEventType.ONE_ON_ONE_ACCEPTED, requesterResponse);
        eventPublisher.publish(userId, SseMatchEventType.ONE_ON_ONE_ACCEPTED, recipientResponse);

        return recipientResponse;
    }

    /**
     * 1:1 매칭 요청을 거절하는 메서드
     *
     * @param userId    수신자 사용자 ID
     * @param requestId 매칭 요청 ID
     * @return 1:1 매칭 응답
     */
    @Override
    @Transactional
    public OneOnOneMatchResponse declineOneOnOneMatch(UUID userId, String requestId) {
        UUID parsedRequestId = parseRequestId(requestId);

        MatchQueueItem item = queueStore.findByRequestId(parsedRequestId)
                .orElseThrow(() -> new BaseException(ErrorCode.MATCH_REQUEST_NOT_FOUND));

        // 수신자 본인인지 확인
        if (!item.getRecipientUserId().equals(userId)) {
            throw new BaseException(ErrorCode.MATCH_REQUEST_NOT_FOUND);
        }

        // 대기 중인 상태에서만 거절 가능
        if (!item.isWaiting()) {
            throw new BaseException(ErrorCode.MATCH_ALREADY_HANDLED);
        }

        // 거절 처리
        item.markDeclined();

        // 요청자에게 거절 이벤트 전송
        OneOnOneMatchResponse requesterResponse = buildOneOnOneResponse(item, "declined");
        eventPublisher.publish(item.getRequesterUserId(), SseMatchEventType.ONE_ON_ONE_DECLINED, requesterResponse);

        return buildOneOnOneResponse(item, "declined");
    }

    /**
     * 요청 ID를 파싱하는 메서드
     *
     * @param requestId 요청 ID 문자열
     * @return 파싱된 UUID
     */
    private UUID parseRequestId(String requestId) {
        try {
            return UUID.fromString(requestId);
        } catch (IllegalArgumentException e) {
            throw new BaseException(ErrorCode.MATCH_REQUEST_NOT_FOUND);
        }
    }

    /**
     * 1:1 매칭 응답을 구성하는 메서드
     *
     * @param item         대기열 항목
     * @param targetStatus 대상 상태
     * @return 1:1 매칭 응답
     */
    private OneOnOneMatchResponse buildOneOnOneResponse(MatchQueueItem item, String targetStatus) {
        return new OneOnOneMatchResponse(
                item.getRequestId().toString(),
                item.getStatus().name().toLowerCase(),
                item.getQueueType().name().toLowerCase(),
                item.getRecipientUserId().toString(),
                targetStatus,
                policy.averageWaitSeconds(),
                item.getCreatedAt()
        );
    }

    /**
     * 1:1 매칭 완료 응답을 구성하는 메서드
     *
     * @param item         대기열 항목
     * @param conference   생성된 컨퍼런스
     * @param targetStatus 대상 상태
     * @return 1:1 매칭 응답
     */
    private OneOnOneMatchResponse buildOneOnOneMatchedResponse(MatchQueueItem item, Conference conference, String targetStatus) {
        return new OneOnOneMatchResponse(
                item.getRequestId().toString(),
                item.getStatus().name().toLowerCase(),
                item.getQueueType().name().toLowerCase(),
                item.getRecipientUserId().toString(),
                targetStatus,
                null,
                item.getCreatedAt()
        );
    }

    /**
     * 컨퍼런스와 참여자를 생성하는 메서드
     *
     * @param requester 요청자 사용자
     * @param recipient 수신자 사용자
     * @return 생성된 컨퍼런스
     */
    private Conference createConference(User requester, User recipient) {
        Conference conference = Conference.builder()
                .status(ConferenceStatus.WAITING)
                .currentRound(0)
                .build();

        Conference savedConference = conferenceRepository.save(conference);

        ConferenceParticipant requesterParticipant = ConferenceParticipant.builder()
                .conference(savedConference)
                .user(requester)
                .build();

        ConferenceParticipant recipientParticipant = ConferenceParticipant.builder()
                .conference(savedConference)
                .user(recipient)
                .build();

        participantRepository.save(requesterParticipant);
        participantRepository.save(recipientParticipant);

        return savedConference;
    }

    @Override
    public OnlineUserListResponse getRandomOnlineUsers(UUID userId, int limit) {
        // 사용자 성별 조회
        Gender myGender = userRepository.findById(userId)
                .map(User::getGender)
                .orElse(null);

        // 사용자의 성별 정보가 없으면 빈 목록 반환
        if (myGender == null) {
            return OnlineUserListResponse.builder()
                    .onlineUsers(List.of())
                    .build();
        }

        Gender oppositeGender = myGender == Gender.MALE ? Gender.FEMALE : Gender.MALE;

        // 현재 연결된 사용자 중 반대 성별의 사용자 목록 조회
        Set<UUID> connectedUserIds = sseService.getConnectedUserIds();
        List<User> oppositeGenderUsers = userRepository.findAllById(connectedUserIds).stream()
                .filter(user -> user.getGender() == oppositeGender)
                .toList();

        // 응답용 사용자 목록 구성
        List<OnlineUserDto> result;
        if (oppositeGenderUsers.size() <= limit) {
            result = oppositeGenderUsers.stream().map(OnlineUserDto::from).toList();

        } else {
            List<User> shuffled = new ArrayList<>(oppositeGenderUsers);
            Collections.shuffle(shuffled); // 무작위 섞기
            result = shuffled.subList(0, limit).stream().map(OnlineUserDto::from).toList();
        }

        // 응답 반환
        return OnlineUserListResponse.builder()
                .onlineUsers(result)
                .build();
    }

}
