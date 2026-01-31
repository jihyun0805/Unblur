package com.ssafy.unblur.domain.match.service.impl;

import com.ssafy.unblur.domain.match.model.MatchQueueItem;
import com.ssafy.unblur.domain.match.model.MatchQueueStatus;
import com.ssafy.unblur.domain.match.model.MatchType;
import com.ssafy.unblur.domain.match.service.MatchQueueService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

/**
 * 인메모리 매칭 대기열 저장소 구현체
 * <p>
 * 단일 인스턴스 환경과 재시작 시 데이터 유실을 감안한 구현체이다.
 */
@Slf4j
@Component
public class InMemoryMatchQueueService implements MatchQueueService {

    /**
     * 요청 ID 기준 대기열 저장소
     * <p>
     * Key: 요청 ID, Value: 대기열 항목
     */
    private final Map<UUID, MatchQueueItem> items = new ConcurrentHashMap<>();

    /**
     * 사용자별 최근 요청 인덱스
     */
    private final Map<String, UUID> userIndexes = new ConcurrentHashMap<>();

    /**
     * 저장소 동기화용 락
     * <p>
     * 여러 스레드가 동시에 save/delete/purge 등을 호출해도 일관성이 깨지지 않도록 보호한다.
     */
    private final ReentrantLock lock = new ReentrantLock();

    @Override
    public MatchQueueItem save(MatchQueueItem item) {
        lock.lock();

        try {
            UUID previousId = userIndexes.put(key(item.getRequesterUserId(), item.getMatchType()), item.getRequestId());

            // 동일 사용자의 이전 요청이 남아있는지 확인
            if (previousId != null && !previousId.equals(item.getRequestId())) {
                items.remove(previousId); // 동일 사용자 이전 요청이 남아있으면 정합성을 위해 정리
                log.warn("이전 매칭 요청 제거. userId={}, matchType={}, previousRequestId={}", item.getRequesterUserId(), item.getMatchType(), previousId);
            }

            items.put(item.getRequestId(), item);
            log.info("매칭 대기열 저장. requestId={}, userId={}, matchType={}, status={}", item.getRequestId(), item.getRequesterUserId(), item.getMatchType(), item.getStatus());

            return item;

        } finally {
            lock.unlock();
        }
    }

    @Override
    public Optional<MatchQueueItem> findRequestById(UUID requestId) {
        return Optional.ofNullable(items.get(requestId));
    }

    @Override
    public Optional<MatchQueueItem> findUserRequestByMatchType(UUID userId, MatchType queueType) {
        UUID requestId = userIndexes.get(key(userId, queueType));

        if (requestId == null) {
            return Optional.empty();
        }

        return Optional.ofNullable(items.get(requestId));
    }


    @Override
    public List<MatchQueueItem> findAllWaitingByMatchType(MatchType queueType) {
        lock.lock();

        try {
            List<MatchQueueItem> result = new ArrayList<>();

            for (MatchQueueItem item : items.values()) {
                if (item.getMatchType() == queueType && item.getStatus() == MatchQueueStatus.WAITING) {
                    result.add(item);
                }
            }

            result.sort(Comparator.comparing(MatchQueueItem::getCreatedAt));
            return result;

        } finally {
            lock.unlock();
        }
    }

    @Override
    public boolean existsWaiting(UUID userId, MatchType queueType) {
        return findUserRequestByMatchType(userId, queueType)
                .filter(MatchQueueItem::isWaiting)
                .isPresent();
    }

    @Override
    public void purgeFinished(LocalDateTime cutoff) {
        lock.lock();

        try {
            int before = items.size();
            items.values().removeIf(item -> shouldRemove(item, cutoff));
            userIndexes.entrySet().removeIf(entry -> !items.containsKey(entry.getValue()));
            int after = items.size();
            if (before != after) {
                log.info("매칭 대기열 정리 완료. removed={}, remaining={}", (before - after), after);
            }

        } finally {
            lock.unlock();
        }
    }

    /**
     * 사용자/유형 기준 인덱스 키를 생성하는 메서드
     *
     * @param userId    사용자 ID
     * @param queueType 매칭 유형
     * @return 인덱스 키
     */
    private String key(UUID userId, MatchType queueType) {
        return userId + ":" + queueType.name();
    }

    /**
     * 정리 대상 여부를 판단하는 메서드
     *
     * @param item   대기열 항목
     * @param cutoff 기준 시각
     * @return 정리 대상이면 true
     */
    private boolean shouldRemove(MatchQueueItem item, LocalDateTime cutoff) {
        if (item.isWaiting()) {
            return false;
        }

        LocalDateTime referenceTime = item.getMatchedAt() != null ? item.getMatchedAt() : item.getCreatedAt();
        return referenceTime.isBefore(cutoff);
    }

}
