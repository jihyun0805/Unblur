package com.ssafy.unblur.domain.match.service.impl;

import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.auth.repository.UserRepository;
import com.ssafy.unblur.domain.match.config.MatchConfig.MatchPolicy;
import com.ssafy.unblur.domain.match.model.Conference;
import com.ssafy.unblur.domain.match.model.ConferenceStatus;
import com.ssafy.unblur.domain.match.model.MatchEventType;
import com.ssafy.unblur.domain.match.model.MatchQueueItem;
import com.ssafy.unblur.domain.match.model.MatchQueueStatus;
import com.ssafy.unblur.domain.match.model.MatchQueueType;
import com.ssafy.unblur.domain.match.dto.QuickMatchResultEvent;
import com.ssafy.unblur.domain.match.repository.ConferenceRepository;
import com.ssafy.unblur.domain.match.repository.MatchCandidateRepository;
import com.ssafy.unblur.domain.match.repository.MatchCandidateRepository.MatchCandidate;
import com.ssafy.unblur.domain.match.service.MatchEventPublisher;
import com.ssafy.unblur.domain.match.service.MatchQueueStore;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("MatchQueueProcessor")
class MatchQueueProcessorTest {

    private static final Clock FIXED_CLOCK = Clock.fixed(
            Instant.parse("2026-01-26T00:00:00Z"),
            ZoneId.of("Asia/Seoul")
    );

    private final MatchQueueStore queueStore = new InMemoryMatchQueueStore();

    private final MatchPolicy policy = new MatchPolicy(
            10,
            4,
            6,
            Duration.ofSeconds(8),
            Duration.ofSeconds(20),
            Duration.ofSeconds(30),
            0.7,
            0.5,
            60,
            Duration.ofMinutes(10)
    );

    @Mock
    private UserRepository userRepository;

    @Mock
    private MatchCandidateRepository matchCandidateRepository;

    @Mock
    private ConferenceRepository conferenceRepository;

    @Mock
    private MatchEventPublisher eventPublisher;

    private MatchQueueProcessor processor() {
        return new MatchQueueProcessor(
                queueStore,
                userRepository,
                matchCandidateRepository,
                conferenceRepository,
                policy,
                eventPublisher,
                FIXED_CLOCK
        );
    }

    @Nested
    @DisplayName("tryImmediateMatch")
    class TryImmediateMatch {

        @Test
        @DisplayName("조건을 만족하는 후보가 있으면 즉시 매칭할 때 매칭이 완료된다")
        void matchWhenCandidateMeetsThreshold() {
            // given: 요청자와 후보가 대기 중이고 유사도가 충분하면
            MatchQueueProcessor matchQueueProcessor = processor();
            UUID requesterId = UUID.randomUUID();
            UUID candidateId = UUID.randomUUID();

            float[] requesterVector = new float[]{1.0f, 0.0f};
            float[] candidateVector = new float[]{1.0f, 0.0f};

            User requester = User.builder()
                    .id(requesterId)
                    .email("requester@example.com")
                    .interestsVector(requesterVector)
                    .build();

            User candidate = User.builder()
                    .id(candidateId)
                    .email("candidate@example.com")
                    .interestsVector(candidateVector)
                    .build();

            LocalDateTime now = LocalDateTime.now(FIXED_CLOCK);
            MatchQueueItem requesterItem = MatchQueueItem.builder()
                    .requestId(UUID.randomUUID())
                    .requesterUserId(requesterId)
                    .queueType(MatchQueueType.QUICK)
                    .createdAt(now)
                    .filters(Map.of())
                    .build();

            MatchQueueItem candidateItem = MatchQueueItem.builder()
                    .requestId(UUID.randomUUID())
                    .requesterUserId(candidateId)
                    .queueType(MatchQueueType.QUICK)
                    .createdAt(now.plusSeconds(1))
                    .filters(Map.of())
                    .build();

            queueStore.save(requesterItem);
            queueStore.save(candidateItem);

            when(userRepository.findById(candidateId)).thenReturn(Optional.of(candidate));
            when(matchCandidateRepository.findQuickCandidates(
                    eq(requesterId),
                    anyString(),
                    argThat(ids -> ids.size() == 1 && ids.contains(candidateId)),
                    eq(null),
                    eq(null),
                    eq(null),
                    eq(null),
                    eq(policy.immediateTopK())
            )).thenReturn(List.of(new MatchCandidate(candidateId, 0.9)));

            when(conferenceRepository.save(any(Conference.class))).thenAnswer(invocation -> Conference.builder()
                    .id(UUID.randomUUID())
                    .status(ConferenceStatus.WAITING)
                    .currentRound(0)
                    .build());

            // when: 즉시 매칭을 시도할 때
            boolean matched = matchQueueProcessor.tryImmediateMatch(requesterItem, requester);

            // then: 매칭이 완료된다
            assertThat(matched).isTrue();
            assertThat(requesterItem.getStatus()).isEqualTo(MatchQueueStatus.MATCHED);
            assertThat(candidateItem.getStatus()).isEqualTo(MatchQueueStatus.MATCHED);
            assertThat(requesterItem.getMatchedAt()).isEqualTo(now);
            assertThat(candidateItem.getMatchedAt()).isEqualTo(now);

            verify(conferenceRepository, times(1)).save(any(Conference.class));
            verify(eventPublisher, times(2))
                    .publish(any(UUID.class), eq(MatchEventType.QUICK_MATCHED), any(QuickMatchResultEvent.class));
        }
    }
}
