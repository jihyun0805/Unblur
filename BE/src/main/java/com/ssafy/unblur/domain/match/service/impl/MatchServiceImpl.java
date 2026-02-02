package com.ssafy.unblur.domain.match.service.impl;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.common.service.SseService;
import com.ssafy.unblur.common.service.event.SseEventType;
import com.ssafy.unblur.common.util.TransactionUtils;
import com.ssafy.unblur.common.annotation.TimeWindow;
import com.ssafy.unblur.domain.auth.model.Gender;
import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.auth.repository.UserRepository;
import com.ssafy.unblur.domain.match.config.MatchConfig.MatchPolicy;
import com.ssafy.unblur.domain.match.dto.event.QuickMatchStageEvent;
import com.ssafy.unblur.domain.match.dto.request.FastMatchingRequest;
import com.ssafy.unblur.domain.match.dto.request.OneOnOneMatchRequest;
import com.ssafy.unblur.domain.match.dto.response.MatchingQueueResponse;
import com.ssafy.unblur.domain.match.dto.response.OneOnOneMatchResponse;
import com.ssafy.unblur.domain.match.dto.response.OneOnOneMatchedResponse;
import com.ssafy.unblur.domain.match.dto.response.OnlineUserDto;
import com.ssafy.unblur.domain.match.dto.response.OnlineUserListResponse;
import com.ssafy.unblur.domain.match.model.*;
import com.ssafy.unblur.domain.match.repository.ConferenceRepository;
import com.ssafy.unblur.domain.match.service.MatchEventPublisher;
import com.ssafy.unblur.domain.match.service.MatchQueueService;
import com.ssafy.unblur.domain.match.service.MatchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
@Service
@RequiredArgsConstructor
public class MatchServiceImpl implements MatchService {

    /**
     * 매칭 대기열 저장소
     */
    private final MatchQueueService matchQueueService;

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
    private final SseService sseService;

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

    @Override
    @Transactional
//    @TimeWindow(start = "20:00", end = "02:00") // Todo: 테스트 이후 주석 해제
    public MatchingQueueResponse startQuickMatch(UUID userId, FastMatchingRequest request) {
        log.info("빠른 매칭 요청 시작. userId={}", userId);
        // 동일 사용자가 이미 대기 중이면 중복 등록 방지
        if (matchQueueService.existsWaiting(userId, MatchType.QUICK)) {
            log.warn("빠른 매칭 중복 요청. userId={}", userId);
            throw new BaseException(ErrorCode.MATCH_ALREADY_QUEUED);
        }

        // 요청자 기본 정보 조회(없으면 매칭 불가)
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        // 대기열 항목 생성 및 등록
        Map<String, Object> filters = request.filters() != null
                ? new HashMap<>(request.filters()) : new HashMap<>();

        MatchQueueItem item = MatchQueueItem.builder()
                .requestId(UUID.randomUUID())
                .requesterUserId(userId)
                .matchType(MatchType.QUICK)
                .createdAt(LocalDateTime.now(clock))
                .filters(filters)
                .build();

        matchQueueService.save(item);
        log.info("빠른 매칭 대기열 등록. userId={}, requestId={}", userId, item.getRequestId());

        // 즉시 매칭 1회 시도
        boolean matched = queueProcessor.tryImmediateMatch(item, user);
        log.info("빠른 매칭 즉시 시도 결과. userId={}, requestId={}, matched={}", userId, item.getRequestId(), matched);

        MatchingQueueResponse response = buildResponse(item);

        if (!matched) {
            eventPublisher.publish(userId, SseEventType.QUICK_WAITING, response);
        }

        return response;
    }

    @Override
    public void cancelQuickMatch(UUID userId, String requestId) {
        log.info("빠른 매칭 취소 요청. userId={}, requestId={}", userId, requestId);
        // 요청 ID 파싱
        UUID parsedRequestId;
        try {
            parsedRequestId = UUID.fromString(requestId);

        } catch (IllegalArgumentException e) {
            throw new BaseException(ErrorCode.MATCH_REQUEST_NOT_FOUND);
        }

        MatchQueueItem item = matchQueueService.findRequestById(parsedRequestId)
                .orElseThrow(() -> new BaseException(ErrorCode.MATCH_REQUEST_NOT_FOUND));

        // 본인의 요청인지 확인
        if (!item.getRequesterUserId().equals(userId)) {
            log.warn("빠른 매칭 취소 권한 없음. userId={}, requestId={}, owner={}", userId, requestId, item.getRequesterUserId());
            throw new BaseException(ErrorCode.MATCH_REQUEST_NOT_FOUND);
        }

        // 대기 중인 상태에서만 취소 가능
        if (!item.isWaiting()) {
            log.warn("빠른 매칭 취소 불가(상태). userId={}, requestId={}, status={}", userId, requestId, item.getStatus());
            throw new BaseException(ErrorCode.MATCH_ALREADY_HANDLED);
        }

        item.markCanceled();

        // SSE 취소 이벤트 전송
        QuickMatchStageEvent event = QuickMatchStageEvent.builder()
                .requestId(requestId)
                .stage("canceled")
                .occurredAt(LocalDateTime.now(clock))
                .build();

        eventPublisher.publish(userId, SseEventType.QUICK_CANCELED, event);
        log.info("빠른 매칭 취소 완료. userId={}, requestId={}", userId, requestId);
    }

    @Override
    public MatchingQueueResponse getQueueStatus(UUID userId) {
        MatchingQueueResponse response = matchQueueService.findUserRequestByMatchType(userId, MatchType.QUICK)
                .map(this::buildResponse)
                .orElse(null);
        log.debug("빠른 매칭 대기열 상태 조회. userId={}, exists={}", userId, response != null);
        return response;
    }

    @Override
    @Transactional
    public OneOnOneMatchResponse startOneOnOneMatch(UUID userId, OneOnOneMatchRequest request) {
        log.info("1:1 매칭 요청 시작. userId={}, targetUserId={}", userId, request.targetUserId());
        // 대상 사용자 ID 파싱
        UUID targetUserId;
        try {
            targetUserId = UUID.fromString(request.targetUserId());

        } catch (IllegalArgumentException e) {
            throw new BaseException(ErrorCode.MATCH_TARGET_NOT_FOUND);
        }

        // 자기 자신에게 매칭 요청 불가
        if (userId.equals(targetUserId)) {
            log.warn("1:1 매칭 자기 자신 요청. userId={}", userId);
            throw new BaseException(ErrorCode.INVALID_INPUT_VALUE);
        }

        // 이전 요청 조회
        Optional<MatchQueueItem> previousRequest = matchQueueService.findUserRequestByMatchType(userId, MatchType.ONE_ON_ONE);

        if (previousRequest.isPresent() && previousRequest.get().isWaiting()) { // 대기 중인 이전 요청이 있을 때
            MatchQueueItem previous = previousRequest.get();
            LocalDateTime now = LocalDateTime.now(clock);

            // 30초 쿨다운 내에는 다른 대상에게 새 요청 불가
            if (now.isBefore(previous.getCreatedAt().plus(policy.timeout()))) {
                log.warn("1:1 매칭 요청 쿨다운(30초) 중. userId={}, previousRequestId={}", userId, previous.getRequestId());
                throw new BaseException(ErrorCode.MATCH_ALREADY_QUEUED);
            }

            // 30초를 넘긴 대기 요청은 즉시 타임아웃 처리
            previous.markTimeout();
            OneOnOneMatchResponse timeoutResponse = buildOneOnOneResponse(previous, "timeout");

            eventPublisher.publish(previous.getRequesterUserId(), SseEventType.ONE_ON_ONE_TIMEOUT, timeoutResponse);
            if (previous.getRecipientUserId() != null) {
                eventPublisher.publish(previous.getRecipientUserId(), SseEventType.ONE_ON_ONE_TIMEOUT, timeoutResponse);
            }

            log.info("1:1 매칭 요청 타임아웃 처리(즉시). userId={}, previousRequestId={}", userId, previous.getRequestId());
        }

        // 대상 사용자가 온라인인지 확인
        if (!sseService.isUserConnected(targetUserId)) {
            log.warn("1:1 매칭 대상 오프라인. userId={}, targetUserId={}", userId, targetUserId);
            throw new BaseException(ErrorCode.MATCH_TARGET_OFFLINE);
        }

        LocalDateTime now = LocalDateTime.now(clock);

        // 대기열 항목 생성 및 등록
        MatchQueueItem item = MatchQueueItem.builder()
                .requestId(UUID.randomUUID())
                .requesterUserId(userId)
                .recipientUserId(targetUserId)
                .matchType(MatchType.ONE_ON_ONE)
                .createdAt(now)
                .filters(Map.of())
                .build();

        matchQueueService.save(item);
        log.info("1:1 매칭 대기열 등록. userId={}, targetUserId={}, requestId={}", userId, targetUserId, item.getRequestId());

        // 대상 사용자에게 알림 전송
        OneOnOneMatchResponse response = buildOneOnOneResponse(item, "pending");
        eventPublisher.publish(targetUserId, SseEventType.ONE_ON_ONE_REQUESTED, response);
        log.info("1:1 매칭 요청 전송. requesterId={}, targetUserId={}, requestId={}", userId, targetUserId, item.getRequestId());

        return response;
    }

    @Override
    @Transactional
    public OneOnOneMatchedResponse acceptOneOnOneMatch(UUID userId, String requestId) {
        log.info("1:1 매칭 수락 요청. userId={}, requestId={}", userId, requestId);
        // 요청 ID 파싱
        UUID parsedRequestId;
        try {
            parsedRequestId = UUID.fromString(requestId);

        } catch (IllegalArgumentException e) {
            throw new BaseException(ErrorCode.MATCH_REQUEST_NOT_FOUND);
        }

        MatchQueueItem item = matchQueueService.findRequestById(parsedRequestId)
                .orElseThrow(() -> new BaseException(ErrorCode.MATCH_REQUEST_NOT_FOUND));

        // 수신자 본인인지 확인
        if (!item.getRecipientUserId().equals(userId)) {
            log.warn("1:1 매칭 수락 권한 없음. userId={}, requestId={}, recipientId={}", userId, requestId, item.getRecipientUserId());
            throw new BaseException(ErrorCode.MATCH_REQUEST_NOT_FOUND);
        }

        // 대기 중인 상태에서만 수락 가능
        if (!item.isWaiting()) {
            log.warn("1:1 매칭 수락 불가(상태). userId={}, requestId={}, status={}", userId, requestId, item.getStatus());
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
        Conference conference = Conference.builder()
                .status(ConferenceStatus.WAITING)
                .currentRound(0)
                .build();

        Conference savedConference = conferenceRepository.save(conference);

        log.info("1:1 매칭 성사. requestId={}, conferenceId={}, requesterId={}, recipientId={}", requestId, savedConference.getId(), requester.getId(), recipient.getId());

        // 양쪽에 매칭 완료 이벤트 전송 (각자에게 상대방 ID 전달)
        OneOnOneMatchedResponse requesterResponse = buildOneOnOneMatchedResponse(item, savedConference, userId);
        OneOnOneMatchedResponse recipientResponse = buildOneOnOneMatchedResponse(item, savedConference, item.getRequesterUserId());

        TransactionUtils.runAfterCommit(() -> {
            eventPublisher.publish(item.getRequesterUserId(), SseEventType.ONE_ON_ONE_ACCEPTED, requesterResponse);
            eventPublisher.publish(userId, SseEventType.ONE_ON_ONE_ACCEPTED, recipientResponse);
        });

        return recipientResponse;
    }

    @Override
    @Transactional
    public OneOnOneMatchResponse declineOneOnOneMatch(UUID userId, String requestId) {
        log.info("1:1 매칭 거절 요청. userId={}, requestId={}", userId, requestId);
        // 요청 ID 파싱
        UUID parsedRequestId;
        try {
            parsedRequestId = UUID.fromString(requestId);

        } catch (IllegalArgumentException e) {
            throw new BaseException(ErrorCode.MATCH_REQUEST_NOT_FOUND);
        }

        MatchQueueItem item = matchQueueService.findRequestById(parsedRequestId)
                .orElseThrow(() -> new BaseException(ErrorCode.MATCH_REQUEST_NOT_FOUND));

        // 수신자 본인인지 확인
        if (!item.getRecipientUserId().equals(userId)) {
            log.warn("1:1 매칭 거절 권한 없음. userId={}, requestId={}, recipientId={}", userId, requestId, item.getRecipientUserId());
            throw new BaseException(ErrorCode.MATCH_REQUEST_NOT_FOUND);
        }

        // 대기 중인 상태에서만 거절 가능
        if (!item.isWaiting()) {
            log.warn("1:1 매칭 거절 불가(상태). userId={}, requestId={}, status={}", userId, requestId, item.getStatus());
            throw new BaseException(ErrorCode.MATCH_ALREADY_HANDLED);
        }

        // 거절 처리
        item.markDeclined();

        // 요청자에게 거절 이벤트 전송
        OneOnOneMatchResponse requesterResponse = buildOneOnOneResponse(item, "declined");
        eventPublisher.publish(item.getRequesterUserId(), SseEventType.ONE_ON_ONE_DECLINED, requesterResponse);
        log.info("1:1 매칭 거절 전송. userId={}, requestId={}, requesterId={}", userId, requestId, item.getRequesterUserId());

        return buildOneOnOneResponse(item, "declined");
    }

    @Override
    public OnlineUserListResponse getRandomOnlineUsers(UUID userId, int limit) {
        log.debug("온라인 사용자 목록 조회. userId={}, limit={}", userId, limit);
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

    /**
     * 빠른 매칭 응답을 구성하는 메서드
     *
     * @param item 대기열 항목
     * @return 응답 DTO
     */
    private MatchingQueueResponse buildResponse(MatchQueueItem item) {
        // 현재 대기열 기준으로 순번/대기시간을 계산
        List<MatchQueueItem> waiting = matchQueueService.findAllWaitingByMatchType(MatchType.QUICK);
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
                .queueType(item.getMatchType().name().toLowerCase())
                .waitingCount(waitingCount)
                .queuedAt(item.getCreatedAt())
                .build();
    }

    /**
     * 1:1 매칭 응답을 구성하는 메서드
     *
     * @param item         대기열 항목
     * @param targetStatus 대상 상태
     * @return 1:1 매칭 응답
     */
    private OneOnOneMatchResponse buildOneOnOneResponse(MatchQueueItem item, String targetStatus) {
        return OneOnOneMatchResponse.builder()
                .requestId(item.getRequestId().toString())
                .status(item.getStatus().name().toLowerCase())
                .queueType(item.getMatchType().name().toLowerCase())
                .targetUserId(item.getRecipientUserId().toString())
                .targetStatus(targetStatus)
                .estimatedWaitSeconds(policy.averageWaitSeconds())
                .queuedAt(item.getCreatedAt())
                .build();
    }

    /**
     * 1:1 매칭 완료 응답을 구성하는 메서드
     *
     * @param item         대기열 항목
     * @param conference   생성된 컨퍼런스
     * @param targetUserId 상대방 사용자 ID
     * @return 1:1 매칭 완료 응답
     */
    private OneOnOneMatchedResponse buildOneOnOneMatchedResponse(MatchQueueItem item, Conference conference, UUID targetUserId) {
        return OneOnOneMatchedResponse.builder()
                .requestId(item.getRequestId().toString())
                .conferenceId(conference.getId().toString())
                .targetUserId(targetUserId.toString())
                .matchedAt(item.getMatchedAt())
                .build();
    }

}
