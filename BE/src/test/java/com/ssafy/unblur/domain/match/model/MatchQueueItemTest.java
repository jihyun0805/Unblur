package com.ssafy.unblur.domain.match.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("MatchQueueItem")
class MatchQueueItemTest {

    @Test
    @DisplayName("완화 시각이 없으면 완화 처리할 때 시각이 저장된다")
    void markRelaxedWhenEmpty() {
        // given: 완화 시각이 없는 대기열 항목이 있으면
        MatchQueueItem item = MatchQueueItem.builder()
                .requestId(UUID.randomUUID())
                .requesterUserId(UUID.randomUUID())
                .queueType(MatchQueueType.QUICK)
                .createdAt(LocalDateTime.now())
                .filters(null)
                .build();

        LocalDateTime relaxedAt = LocalDateTime.now().minusSeconds(10);

        // when: 완화 처리할 때
        item.markRelaxed(relaxedAt);

        // then: 완화 시각이 저장된다
        assertThat(item.getRelaxedAt()).isEqualTo(relaxedAt);
    }

    @Test
    @DisplayName("완화 시각이 이미 있으면 완화 처리할 때 변경되지 않는다")
    void markRelaxedWhenAlreadySet() {
        // given: 완화 시각이 이미 있는 대기열 항목이 있으면
        LocalDateTime initialRelaxedAt = LocalDateTime.now().minusSeconds(20);
        MatchQueueItem item = MatchQueueItem.builder()
                .requestId(UUID.randomUUID())
                .requesterUserId(UUID.randomUUID())
                .queueType(MatchQueueType.QUICK)
                .createdAt(LocalDateTime.now())
                .filters(null)
                .build();
        item.markRelaxed(initialRelaxedAt);

        LocalDateTime newRelaxedAt = LocalDateTime.now();

        // when: 다시 완화 처리할 때
        item.markRelaxed(newRelaxedAt);

        // then: 기존 완화 시각이 유지된다
        assertThat(item.getRelaxedAt()).isEqualTo(initialRelaxedAt);
    }
}
