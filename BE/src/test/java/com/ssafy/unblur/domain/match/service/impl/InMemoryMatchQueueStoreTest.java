package com.ssafy.unblur.domain.match.service.impl;

import com.ssafy.unblur.domain.match.model.MatchQueueItem;
import com.ssafy.unblur.domain.match.model.MatchQueueType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class InMemoryMatchQueueStoreTest {

    private InMemoryMatchQueueStore store;

    @BeforeEach
    void setUp() {
        store = new InMemoryMatchQueueStore();
    }

    @Nested
    @DisplayName("save/findByRequestId")
    class SaveAndFindByRequestId {

        @Test
        @DisplayName("요청 ID로 저장하면 동일 항목을 조회한다")
        void saveAndFindByRequestId_returnsItem() {
            // given: 요청 ID로 조회할 수 있는 대기열 항목이 주어졌을 때
            MatchQueueItem item = createItem(UUID.randomUUID(), UUID.randomUUID(), MatchQueueType.QUICK, nowMinusSeconds(10));

            // when: 대기열에 저장한 뒤 요청 ID로 조회하면
            store.save(item);

            // then: 동일 항목이 반환된다
            assertThat(store.findByRequestId(item.getRequestId())).contains(item);
        }

        @Test
        @DisplayName("동일 사용자가 다시 저장하면 이전 요청은 교체된다")
        void save_replacesPreviousRequestForSameUser() {
            // given: 동일 사용자의 두 요청이 주어졌을 때
            UUID userId = UUID.randomUUID();
            MatchQueueItem first = createItem(UUID.randomUUID(), userId, MatchQueueType.QUICK, nowMinusSeconds(20));
            MatchQueueItem second = createItem(UUID.randomUUID(), userId, MatchQueueType.QUICK, nowMinusSeconds(5));

            // when: 두 요청을 순서대로 저장하면
            store.save(first);
            store.save(second);

            // then: 이전 요청은 제거되고 최신 요청만 남는다
            assertThat(store.findByRequestId(first.getRequestId())).isEmpty();
            assertThat(store.findByUserId(userId, MatchQueueType.QUICK)).contains(second);
        }
    }

    @Nested
    @DisplayName("findByUserId")
    class FindByUserId {

        @Test
        @DisplayName("저장되지 않은 사용자로 조회하면 빈 결과를 반환한다")
        void findByUserId_returnsEmptyWhenMissing() {
            // given: 저장되지 않은 사용자 ID가 주어졌을 때
            // when: 사용자 ID로 조회하면
            // then: 빈 결과를 반환한다
            assertThat(store.findByUserId(UUID.randomUUID(), MatchQueueType.QUICK)).isEmpty();
        }
    }

    @Nested
    @DisplayName("delete")
    class Delete {

        @Test
        @DisplayName("요청을 삭제하면 저장소와 인덱스에서 함께 제거된다")
        void delete_removesItemAndIndex() {
            // given: 저장된 요청이 주어졌을 때
            UUID userId = UUID.randomUUID();
            MatchQueueItem item = createItem(UUID.randomUUID(), userId, MatchQueueType.QUICK, nowMinusSeconds(10));

            // when: 요청을 삭제하면
            store.save(item);
            store.delete(item.getRequestId());

            // then: 요청과 인덱스가 모두 제거된다
            assertThat(store.findByRequestId(item.getRequestId())).isEmpty();
            assertThat(store.findByUserId(userId, MatchQueueType.QUICK)).isEmpty();
        }
    }

    @Nested
    @DisplayName("findWaitingByType")
    class FindWaitingByType {

        @Test
        @DisplayName("대기 항목만 생성 시각 오름차순으로 반환한다")
        void findWaitingByType_returnsSortedWaitingOnly() {
            // given: 대기/완료/다른 유형 항목이 주어졌을 때
            MatchQueueItem oldest = createItem(UUID.randomUUID(), UUID.randomUUID(), MatchQueueType.QUICK, nowMinusSeconds(30));
            MatchQueueItem middle = createItem(UUID.randomUUID(), UUID.randomUUID(), MatchQueueType.QUICK, nowMinusSeconds(20));
            MatchQueueItem newest = createItem(UUID.randomUUID(), UUID.randomUUID(), MatchQueueType.QUICK, nowMinusSeconds(10));
            MatchQueueItem otherType = createItem(UUID.randomUUID(), UUID.randomUUID(), MatchQueueType.ONE_ON_ONE, nowMinusSeconds(5));

            middle.markMatched(LocalDateTime.now());

            // when: 특정 유형의 대기 목록을 조회하면
            store.save(newest);
            store.save(oldest);
            store.save(middle);
            store.save(otherType);

            List<MatchQueueItem> waiting = store.findWaitingByType(MatchQueueType.QUICK);

            // then: 대기 중인 항목만 시간순으로 나온다
            assertThat(waiting).containsExactly(oldest, newest);
        }
    }

    @Nested
    @DisplayName("existsWaiting")
    class ExistsWaiting {

        @Test
        @DisplayName("대기 중인 요청이 있으면 true를 반환한다")
        void existsWaiting_returnsTrueWhenWaiting() {
            // given: 대기 중인 요청이 주어졌을 때
            UUID userId = UUID.randomUUID();
            MatchQueueItem item = createItem(UUID.randomUUID(), userId, MatchQueueType.QUICK, nowMinusSeconds(10));

            // when: 대기 여부를 확인하면
            store.save(item);

            // then: true를 반환한다
            assertThat(store.existsWaiting(userId, MatchQueueType.QUICK)).isTrue();
        }

        @Test
        @DisplayName("대기 상태가 아니면 false를 반환한다")
        void existsWaiting_returnsFalseWhenNotWaiting() {
            // given: 대기 상태가 아닌 요청이 주어졌을 때
            UUID userId = UUID.randomUUID();
            MatchQueueItem item = createItem(UUID.randomUUID(), userId, MatchQueueType.QUICK, nowMinusSeconds(10));
            item.markCanceled();

            // when: 대기 여부를 확인하면
            store.save(item);

            // then: false를 반환한다
            assertThat(store.existsWaiting(userId, MatchQueueType.QUICK)).isFalse();
        }

        @Test
        @DisplayName("요청이 없으면 false를 반환한다")
        void existsWaiting_returnsFalseWhenMissing() {
            // given: 저장되지 않은 사용자 ID가 주어졌을 때
            // when: 대기 여부를 확인하면
            // then: false를 반환한다
            assertThat(store.existsWaiting(UUID.randomUUID(), MatchQueueType.QUICK)).isFalse();
        }
    }

    @Nested
    @DisplayName("purgeFinished")
    class PurgeFinished {

        @Test
        @DisplayName("기준 시각 이전의 완료 항목은 제거된다")
        void purgeFinished_removesOldFinishedItems() {
            // given: 기준 시각 이전에 완료된 요청이 주어졌을 때
            UUID userId = UUID.randomUUID();
            LocalDateTime oldTime = nowMinusSeconds(120);
            MatchQueueItem finished = createItem(UUID.randomUUID(), userId, MatchQueueType.QUICK, oldTime);
            finished.markMatched(oldTime.minusSeconds(5));

            // when: 정리 메서드를 호출하면
            store.save(finished);

            store.purgeFinished(nowMinusSeconds(30));

            // then: 저장소와 인덱스에서 제거된다
            assertThat(store.findByRequestId(finished.getRequestId())).isEmpty();
            assertThat(store.findByUserId(userId, MatchQueueType.QUICK)).isEmpty();
        }

        @Test
        @DisplayName("기준 시각 이전의 타임아웃 항목은 제거된다")
        void purgeFinished_removesOldTimeoutItemsBasedOnCreatedAt() {
            // given: 기준 시각 이전에 타임아웃된 요청이 주어졌을 때
            UUID userId = UUID.randomUUID();
            LocalDateTime oldTime = nowMinusSeconds(120);
            MatchQueueItem timeoutItem = createItem(UUID.randomUUID(), userId, MatchQueueType.QUICK, oldTime);
            timeoutItem.markTimeout();

            // when: 정리 메서드를 호출하면
            store.save(timeoutItem);

            store.purgeFinished(nowMinusSeconds(30));

            // then: 저장소와 인덱스에서 제거된다
            assertThat(store.findByRequestId(timeoutItem.getRequestId())).isEmpty();
            assertThat(store.findByUserId(userId, MatchQueueType.QUICK)).isEmpty();
        }

        @Test
        @DisplayName("기준 시각 이후의 항목은 유지된다")
        void purgeFinished_keepsRecentOrWaitingItems() {
            // given: 기준 시각 이후의 대기/종료 요청이 주어졌을 때
            UUID waitingUserId = UUID.randomUUID();
            MatchQueueItem waiting = createItem(UUID.randomUUID(), waitingUserId, MatchQueueType.QUICK, nowMinusSeconds(5));

            UUID recentCanceledUserId = UUID.randomUUID();
            MatchQueueItem canceled = createItem(UUID.randomUUID(), recentCanceledUserId, MatchQueueType.QUICK, nowMinusSeconds(5));
            canceled.markTimeout();

            // when: 정리 메서드를 호출하면
            store.save(waiting);
            store.save(canceled);

            store.purgeFinished(nowMinusSeconds(10));

            // then: 둘 다 유지된다
            assertThat(store.findByRequestId(waiting.getRequestId())).contains(waiting);
            assertThat(store.findByRequestId(canceled.getRequestId())).contains(canceled);
        }
    }

    /**
     * 테스트용 대기열 항목을 생성하는 메서드
     *
     * @param requestId 요청 ID
     * @param userId    사용자 ID
     * @param type      매칭 유형
     * @param createdAt 생성 시각
     * @return 대기열 항목
     */
    private MatchQueueItem createItem(UUID requestId, UUID userId, MatchQueueType type, LocalDateTime createdAt) {
        return MatchQueueItem.builder()
                .requestId(requestId)
                .requesterUserId(userId)
                .queueType(type)
                .createdAt(createdAt)
                .build();
    }

    /**
     * 현재 시각 기준으로 n초 이전 시각을 반환하는 메서드
     *
     * @param seconds 현재로부터 뺄 초
     * @return 기준 시각
     */
    private LocalDateTime nowMinusSeconds(long seconds) {
        return LocalDateTime.now().minusSeconds(seconds);
    }
}
