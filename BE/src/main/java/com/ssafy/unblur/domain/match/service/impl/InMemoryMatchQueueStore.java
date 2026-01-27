package com.ssafy.unblur.domain.match.service.impl;

import com.ssafy.unblur.domain.match.model.MatchQueueItem;
import com.ssafy.unblur.domain.match.model.MatchQueueStatus;
import com.ssafy.unblur.domain.match.model.MatchQueueType;
import com.ssafy.unblur.domain.match.service.MatchQueueStore;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

/**
 * 인메모리 매칭 대기열 저장소 구현체
 * <p>
 * 단일 인스턴스 환경과 재시작 시 데이터 유실을 감안한 구현체이다.
 */
@Component
public class InMemoryMatchQueueStore implements MatchQueueStore {

    /**
     * 요청 ID 기준 대기열 저장소
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
        lock.lock(); // 인덱스와 실제 저장소를 함께 갱신해야 하므로 하나의 락으로 보호

        try {
            UUID previousId = userIndexes.put(key(item.getRequesterUserId(), item.getQueueType()), item.getRequestId());

            // 동일 사용자의 이전 요청이 남아있는지 확인
            if (previousId != null && !previousId.equals(item.getRequestId())) {
                items.remove(previousId); // 동일 사용자 이전 요청이 남아있으면 정합성을 위해 정리
            }

            items.put(item.getRequestId(), item);
            return item;

        } finally {
            lock.unlock();
        }
    }

    @Override
    public Optional<MatchQueueItem> findByRequestId(UUID requestId) {
        return Optional.ofNullable(items.get(requestId));
    }

    @Override
    public Optional<MatchQueueItem> findByUserId(UUID userId, MatchQueueType queueType) {
        UUID requestId = userIndexes.get(key(userId, queueType));

        if (requestId == null) {
            return Optional.empty();
        }

        return Optional.ofNullable(items.get(requestId));
    }

    @Override
    public void delete(UUID requestId) {
        lock.lock(); // 실제 저장소와 인덱스를 함께 삭제해야 하므로 락으로 보호

        try {
            MatchQueueItem removed = items.remove(requestId);

            if (removed != null) {
                userIndexes.remove(key(removed.getRequesterUserId(), removed.getQueueType()));
            }

        } finally {
            lock.unlock();
        }
    }

    /**
     * 특정 매칭 유형의 대기 중인 항목만 조회하는 메서드
     *
     * @param queueType 매칭 유형
     * @return 대기열 목록
     */
    @Override
    public List<MatchQueueItem> findWaitingByType(MatchQueueType queueType) {
        lock.lock(); // 대기 상태 판단과 정렬까지 일관되게 가져오기 위해 락으로 보호

        try {
            List<MatchQueueItem> result = new ArrayList<>();

            for (MatchQueueItem item : items.values()) {
                if (item.getQueueType() == queueType && item.getStatus() == MatchQueueStatus.WAITING) {
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
    public boolean existsWaiting(UUID userId, MatchQueueType queueType) {
        return findByUserId(userId, queueType)
                .filter(MatchQueueItem::isWaiting)
                .isPresent();
    }

    @Override
    public void purgeFinished(LocalDateTime cutoff) {
        lock.lock(); // 상태 변경 이후 오래된 항목을 정리하고, 인덱스도 함께 정리

        try {
            items.values().removeIf(item -> shouldRemove(item, cutoff));
            userIndexes.entrySet().removeIf(entry -> !items.containsKey(entry.getValue()));

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
    private String key(UUID userId, MatchQueueType queueType) {
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
