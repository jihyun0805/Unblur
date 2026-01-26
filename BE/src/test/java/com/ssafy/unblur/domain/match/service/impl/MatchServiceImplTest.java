package com.ssafy.unblur.domain.match.service.impl;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.auth.repository.UserRepository;
import com.ssafy.unblur.domain.match.config.MatchConfig.MatchPolicy;
import com.ssafy.unblur.domain.match.dto.FastMatchingRequest;
import com.ssafy.unblur.domain.match.dto.MatchingQueueResponse;
import com.ssafy.unblur.domain.match.model.Conference;
import com.ssafy.unblur.domain.match.model.ConferenceParticipant;
import com.ssafy.unblur.domain.match.model.MatchEventType;
import com.ssafy.unblur.domain.match.model.MatchQueueItem;
import com.ssafy.unblur.domain.match.model.MatchQueueStatus;
import com.ssafy.unblur.domain.match.model.MatchQueueType;
import com.ssafy.unblur.domain.match.repository.ConferenceParticipantRepository;
import com.ssafy.unblur.domain.match.repository.ConferenceRepository;
import com.ssafy.unblur.domain.match.repository.MatchCandidateRepository;
import com.ssafy.unblur.domain.match.repository.MatchCandidateRepository.MatchCandidate;
import com.ssafy.unblur.domain.match.service.MatchEventPublisher;
import com.ssafy.unblur.domain.match.service.MatchQueueStore;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MatchServiceImpl")
class MatchServiceImplTest {

    private static final Clock FIXED_CLOCK = Clock.fixed(
            Instant.parse("2026-01-26T00:00:00Z"),
            ZoneId.of("Asia/Seoul")
    );

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
    private MatchQueueStore queueStore;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MatchQueueProcessor queueProcessor;

    @Mock
    private MatchEventPublisher eventPublisher;

    @Captor
    private ArgumentCaptor<MatchQueueItem> itemCaptor;

    private MatchServiceImpl matchService;

    @BeforeEach
    void setUp() {
        matchService = new MatchServiceImpl(
                queueStore,
                userRepository,
                queueProcessor,
                eventPublisher,
                policy,
                FIXED_CLOCK
        );
    }

    @Nested
    @DisplayName("startQuickMatch")
    class StartQuickMatch {

        @Test
        @DisplayName("이미 대기 중인 사용자가 있으면 요청할 때 중복 등록 오류가 발생한다")
        void throwWhenAlreadyQueued() {
            // given: 동일 사용자가 이미 대기 중이면
            UUID userId = UUID.randomUUID();
            FastMatchingRequest request = new FastMatchingRequest();
            when(queueStore.existsWaiting(userId, MatchQueueType.QUICK)).thenReturn(true);

            // when: 빠른 매칭을 요청할 때
            BaseException exception = (BaseException) org.junit.jupiter.api.Assertions.assertThrows(
                    BaseException.class,
                    () -> matchService.startQuickMatch(userId, request)
            );

            // then: 중복 등록 오류가 발생한다
            assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.MATCH_ALREADY_QUEUED);
        }

        @Test
        @DisplayName("사용자 정보가 없으면 요청할 때 사용자 없음 오류가 발생한다")
        void throwWhenUserNotFound() {
            // given: 사용자 정보가 없으면
            UUID userId = UUID.randomUUID();
            FastMatchingRequest request = new FastMatchingRequest();
            when(queueStore.existsWaiting(userId, MatchQueueType.QUICK)).thenReturn(false);
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            // when: 빠른 매칭을 요청할 때
            BaseException exception = (BaseException) org.junit.jupiter.api.Assertions.assertThrows(
                    BaseException.class,
                    () -> matchService.startQuickMatch(userId, request)
            );

            // then: 사용자 없음 오류가 발생한다
            assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.USER_NOT_FOUND);
        }

        @Test
        @DisplayName("대기열이 비어 있으면 요청할 때 대기열 응답이 반환된다")
        void returnQueueResponseWhenQueued() {
            // given: 사용자 정보와 대기열이 준비되어 있으면
            UUID userId = UUID.randomUUID();
            FastMatchingRequest request = new FastMatchingRequest();
            request.setFilters(Map.of("ageMin", 24));

            User user = User.builder()
                    .id(userId)
                    .email("user@example.com")
                    .build();

            AtomicReference<MatchQueueItem> savedItem = new AtomicReference<>();
            when(queueStore.existsWaiting(userId, MatchQueueType.QUICK)).thenReturn(false);
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(queueStore.save(any())).thenAnswer(invocation -> {
                MatchQueueItem item = invocation.getArgument(0);
                savedItem.set(item);
                return item;
            });
            when(queueStore.findWaitingByType(MatchQueueType.QUICK))
                    .thenAnswer(invocation -> List.of(savedItem.get()));

            // when: 빠른 매칭을 요청할 때
            MatchingQueueResponse response = matchService.startQuickMatch(userId, request);

            // then: 대기열 응답이 반환된다
            verify(queueStore).save(itemCaptor.capture());
            verify(queueProcessor).tryImmediateMatch(itemCaptor.getValue(), user);
            verify(eventPublisher).publish(eq(userId), eq(MatchEventType.QUICK_WAITING), any(MatchingQueueResponse.class));

            MatchQueueItem item = itemCaptor.getValue();
            LocalDateTime expectedCreatedAt = LocalDateTime.now(FIXED_CLOCK);

            assertThat(item.getRequesterUserId()).isEqualTo(userId);
            assertThat(item.getQueueType()).isEqualTo(MatchQueueType.QUICK);
            assertThat(item.getCreatedAt()).isEqualTo(expectedCreatedAt);
            assertThat(item.getFilters()).isEqualTo(request.getFilters());

            assertThat(response.requestId()).isNotNull();
            assertThat(response.status()).isEqualTo(MatchQueueStatus.WAITING.name().toLowerCase());
            assertThat(response.isQueued()).isTrue();
            assertThat(response.position()).isEqualTo(1);
            assertThat(response.estimatedWaitSeconds()).isEqualTo(policy.averageWaitSeconds());
            assertThat(response.queueType()).isEqualTo(MatchQueueType.QUICK.name().toLowerCase());
            assertThat(response.waitingCount()).isEqualTo(1);
            assertThat(response.queuedAt()).isEqualTo(expectedCreatedAt);
        }

        @Test
        @DisplayName("대기열에 후보가 있으면 요청할 때 즉시 매칭 결과가 반환된다")
        void returnMatchedResponseWhenImmediateMatchSuccess() {
            // given: 대기열에 후보가 있고 유사도가 충분하면
            MatchQueueStore localQueueStore = new InMemoryMatchQueueStore();
            UserRepository localUserRepository = mock(UserRepository.class);
            MatchCandidateRepository candidateRepository = mock(MatchCandidateRepository.class);
            ConferenceRepository conferenceRepository = mock(ConferenceRepository.class);
            ConferenceParticipantRepository participantRepository = mock(ConferenceParticipantRepository.class);

            MatchQueueProcessor localProcessor = new MatchQueueProcessor(
                    localQueueStore,
                    localUserRepository,
                    candidateRepository,
                    conferenceRepository,
                    participantRepository,
                    policy,
                    (userId, type, response) -> {
                    },
                    FIXED_CLOCK
            );

            MatchServiceImpl localService = new MatchServiceImpl(
                    localQueueStore,
                    localUserRepository,
                    localProcessor,
                    (userId, type, response) -> {
                    },
                    policy,
                    FIXED_CLOCK
            );

            UUID requesterId = UUID.randomUUID();
            UUID candidateId = UUID.randomUUID();

            User requester = User.builder()
                    .id(requesterId)
                    .email("requester@example.com")
                    .interestsVector(new float[]{1.0f, 0.0f})
                    .build();

            User candidate = User.builder()
                    .id(candidateId)
                    .email("candidate@example.com")
                    .interestsVector(new float[]{1.0f, 0.0f})
                    .build();

            LocalDateTime now = LocalDateTime.now(FIXED_CLOCK);
            MatchQueueItem candidateItem = MatchQueueItem.builder()
                    .requestId(UUID.randomUUID())
                    .requesterUserId(candidateId)
                    .queueType(MatchQueueType.QUICK)
                    .createdAt(now.minusSeconds(1))
                    .filters(Map.of())
                    .build();

            localQueueStore.save(candidateItem);

            when(localUserRepository.findById(requesterId)).thenReturn(Optional.of(requester));
            when(localUserRepository.findById(candidateId)).thenReturn(Optional.of(candidate));

            when(candidateRepository.findQuickCandidates(
                    eq(requesterId),
                    anyString(),
                    argThat(ids -> ids.size() == 1 && ids.contains(candidateId)),
                    eq(null),
                    eq(null),
                    eq(null),
                    eq(null),
                    eq(policy.immediateTopK())
            )).thenReturn(List.of(new MatchCandidate(candidateId, 0.9)));

            when(conferenceRepository.save(any(Conference.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
            when(participantRepository.save(any(ConferenceParticipant.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            FastMatchingRequest request = new FastMatchingRequest();
            request.setFilters(Map.of());

            // when: 빠른 매칭을 요청할 때
            MatchingQueueResponse response = localService.startQuickMatch(requesterId, request);

            // then: 즉시 매칭 결과가 반환된다
            assertThat(response.status()).isEqualTo(MatchQueueStatus.MATCHED.name().toLowerCase());
            assertThat(response.isQueued()).isFalse();
            assertThat(response.position()).isNull();
            assertThat(response.estimatedWaitSeconds()).isNull();
            assertThat(response.waitingCount()).isZero();
            assertThat(response.queuedAt()).isEqualTo(now);

            assertThat(candidateItem.getStatus()).isEqualTo(MatchQueueStatus.MATCHED);

            ArgumentCaptor<ConferenceParticipant> participantCaptor = ArgumentCaptor.forClass(ConferenceParticipant.class);
            verify(participantRepository, times(2)).save(participantCaptor.capture());
            List<UUID> savedUserIds = new ArrayList<>();
            for (ConferenceParticipant participant : participantCaptor.getAllValues()) {
                savedUserIds.add(participant.getUser().getId());
            }
            assertThat(savedUserIds).containsExactlyInAnyOrder(requesterId, candidateId);
        }
    }
}
