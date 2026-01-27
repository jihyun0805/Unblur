package com.ssafy.unblur.domain.match.service.impl;

import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.auth.repository.UserRepository;
import com.ssafy.unblur.domain.match.model.Conference;
import com.ssafy.unblur.domain.match.model.ConferenceParticipant;
import com.ssafy.unblur.domain.match.model.ConferenceRound;
import com.ssafy.unblur.domain.match.model.ConferenceRoundStatus;
import com.ssafy.unblur.domain.match.model.ConferenceStatus;
import com.ssafy.unblur.domain.match.repository.ConferenceParticipantRepository;
import com.ssafy.unblur.domain.match.repository.ConferenceRepository;
import com.ssafy.unblur.domain.match.repository.ConferenceRoundRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ConferenceLifecycleServiceImpl")
class ConferenceLifecycleServiceImplTest {

    private static final Clock FIXED_CLOCK = Clock.fixed(
            Instant.parse("2026-01-26T00:00:00Z"),
            ZoneId.of("Asia/Seoul")
    );

    @Mock
    private ConferenceRepository conferenceRepository;

    @Mock
    private ConferenceParticipantRepository participantRepository;

    @Mock
    private ConferenceRoundRepository roundRepository;

    @Mock
    private UserRepository userRepository;

    @Captor
    private ArgumentCaptor<ConferenceRound> roundCaptor;

    private ConferenceLifecycleServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ConferenceLifecycleServiceImpl(
                conferenceRepository,
                participantRepository,
                roundRepository,
                userRepository,
                FIXED_CLOCK
        );
    }

    @Nested
    @DisplayName("onJoin")
    class OnJoin {

        @Test
        @DisplayName("두 번째 참가자가 입장하면 세션이 활성화되고 1라운드가 생성된다")
        void activateConferenceWhenSecondParticipantJoins() {
            // given: 대기 중인 세션과 두 번째 참가자가 있으면
            UUID conferenceId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();

            Conference conference = Conference.builder()
                    .id(conferenceId)
                    .status(ConferenceStatus.WAITING)
                    .currentRound(0)
                    .build();

            User user = User.builder()
                    .id(userId)
                    .email("user@example.com")
                    .build();

            when(conferenceRepository.findById(conferenceId)).thenReturn(Optional.of(conference));
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(participantRepository.findByConference_IdAndUser_Id(conferenceId, userId))
                    .thenReturn(Optional.empty());
            when(participantRepository.save(any(ConferenceParticipant.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
            when(participantRepository.countByConference_IdAndLeftAtIsNull(conferenceId)).thenReturn(2L);
            when(roundRepository.save(any(ConferenceRound.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // when: 입장 이벤트를 기록할 때
            service.onJoin(conferenceId, userId);

            // then: 세션이 활성화되고 1라운드가 생성된다
            LocalDateTime expectedNow = LocalDateTime.now(FIXED_CLOCK);
            assertThat(conference.getStatus()).isEqualTo(ConferenceStatus.ACTIVE);
            assertThat(conference.getCurrentRound()).isEqualTo(1);
            assertThat(conference.getStartedAt()).isEqualTo(expectedNow);

            verify(roundRepository).save(roundCaptor.capture());
            ConferenceRound savedRound = roundCaptor.getValue();
            assertThat(savedRound.getRoundNumber()).isEqualTo(1);
            assertThat(savedRound.getStatus()).isEqualTo(ConferenceRoundStatus.ACTIVE);
        }
    }

    @Nested
    @DisplayName("onLeave")
    class OnLeave {

        @Test
        @DisplayName("마지막 참가자가 퇴장하면 세션과 라운드가 종료된다")
        void completeConferenceWhenLastParticipantLeaves() {
            // given: 활성 세션과 참가자가 있으면
            UUID conferenceId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();

            Conference conference = Conference.builder()
                    .id(conferenceId)
                    .status(ConferenceStatus.ACTIVE)
                    .currentRound(1)
                    .build();

            ConferenceParticipant participant = ConferenceParticipant.builder()
                    .conference(conference)
                    .user(User.builder().id(userId).email("user@example.com").build())
                    .build();

            ConferenceRound round = ConferenceRound.builder()
                    .conference(conference)
                    .roundNumber(1)
                    .status(ConferenceRoundStatus.ACTIVE)
                    .startedAt(LocalDateTime.now(FIXED_CLOCK).minusMinutes(5))
                    .build();

            when(participantRepository.findByConference_IdAndUser_Id(conferenceId, userId))
                    .thenReturn(Optional.of(participant));
            when(participantRepository.countByConference_IdAndLeftAtIsNull(conferenceId)).thenReturn(0L);
            when(conferenceRepository.findById(conferenceId)).thenReturn(Optional.of(conference));
            when(roundRepository.findFirstByConference_IdAndStatus(conferenceId, ConferenceRoundStatus.ACTIVE))
                    .thenReturn(Optional.of(round));

            // when: 퇴장 이벤트를 기록할 때
            service.onLeave(conferenceId, userId);

            // then: 세션과 라운드가 종료된다
            LocalDateTime expectedNow = LocalDateTime.now(FIXED_CLOCK);
            assertThat(participant.getLeftAt()).isEqualTo(expectedNow);
            assertThat(conference.getStatus()).isEqualTo(ConferenceStatus.COMPLETED);
            assertThat(conference.getEndedAt()).isEqualTo(expectedNow);
            assertThat(round.getStatus()).isEqualTo(ConferenceRoundStatus.COMPLETED);
            assertThat(round.getEndedAt()).isEqualTo(expectedNow);
            assertThat(round.getDurationSeconds()).isEqualTo(300);
        }
    }
}
