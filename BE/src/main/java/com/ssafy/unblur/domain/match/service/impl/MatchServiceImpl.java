package com.ssafy.unblur.domain.match.service.impl;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.domain.match.config.MatchConfig.MatchPolicy;
import com.ssafy.unblur.domain.match.dto.FastMatchingRequest;
import com.ssafy.unblur.domain.match.dto.MatchingQueueResponse;
import com.ssafy.unblur.domain.match.model.MatchEventType;
import com.ssafy.unblur.domain.match.model.MatchQueueItem;
import com.ssafy.unblur.domain.match.model.MatchQueueStatus;
import com.ssafy.unblur.domain.match.model.MatchQueueType;
import com.ssafy.unblur.domain.match.service.MatchEventPublisher;
import com.ssafy.unblur.domain.match.service.MatchQueueStore;
import com.ssafy.unblur.domain.match.service.MatchService;
import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

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
     * 매칭 정책 설정값
     */
    private final MatchPolicy policy;

    /**
     * 기준 시각 제공용 Clock
     */
    private final Clock clock;

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
            eventPublisher.publish(userId, MatchEventType.QUICK_WAITING, response);
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
}
