package com.ssafy.unblur.domain.match.service;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.common.service.SseService;
import com.ssafy.unblur.common.util.SecurityUtil;
import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.auth.repository.UserRepository;
import com.ssafy.unblur.domain.chat.repository.ChatMessageRepository;
import com.ssafy.unblur.domain.match.dto.response.ConferenceHistoryItemDto;
import com.ssafy.unblur.domain.match.dto.response.ConferenceHistoryResponseDto;
import com.ssafy.unblur.domain.match.dto.response.ConferenceHistorySummaryDto;
import com.ssafy.unblur.domain.match.dto.response.PartnerProfileResponseDto;
import com.ssafy.unblur.domain.match.model.Conference;
import com.ssafy.unblur.domain.match.model.ConferenceParticipant;
import com.ssafy.unblur.domain.match.repository.ConferenceParticipantRepository;
import com.ssafy.unblur.domain.match.repository.ConferenceRoundRepository;
import com.ssafy.unblur.domain.user.repository.UserBlockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConferenceHistoryService {

    private final UserRepository userRepository;
    private final ConferenceParticipantRepository conferenceParticipantRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ConferenceRoundRepository conferenceRoundRepository;
    private final SseService sseService;
    private final UserBlockRepository userBlockRepository;

    @Transactional(readOnly = true)
    public ConferenceHistoryResponseDto getMyConferenceHistory(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        Page<ConferenceParticipant> page = conferenceParticipantRepository
                .findByUserOrderByConferenceCreatedAtDesc(user, pageable);

        List<UUID> conferenceIds = page.getContent().stream()
                .map(cp -> cp.getConference().getId())
                .toList();

        Map<UUID, List<ConferenceParticipant>> participantsByConference = fetchParticipantsByConference(conferenceIds);

        Set<UUID> connectedUserIds = sseService.getConnectedUserIds();
        Set<UUID> blockedUserIds = fetchBlockedUserIds(user, participantsByConference);

        List<ConferenceHistoryItemDto> items = page.getContent().stream()
                .map(cp -> toHistoryItem(cp, user, participantsByConference, connectedUserIds, blockedUserIds))
                .toList();

        ConferenceHistorySummaryDto summary = buildSummary(user);

        return new ConferenceHistoryResponseDto(
                summary,
                items,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }

    private Map<UUID, List<ConferenceParticipant>> fetchParticipantsByConference(List<UUID> conferenceIds) {
        if (conferenceIds.isEmpty()) {
            return Collections.emptyMap();
        }
        return conferenceParticipantRepository.findByConferenceIdIn(conferenceIds).stream()
                .collect(Collectors.groupingBy(cp -> cp.getConference().getId()));
    }

    private ConferenceHistoryItemDto toHistoryItem(
            ConferenceParticipant participant,
            User me,
            Map<UUID, List<ConferenceParticipant>> participantsByConference,
            Set<UUID> connectedUserIds,
            Set<UUID> blockedUserIds
    ) {
        Conference conference = participant.getConference();
        List<ConferenceParticipant> participants = participantsByConference.getOrDefault(conference.getId(), List.of());

        ConferenceParticipant partner = participants.stream()
                .filter(p -> !p.getUser().getId().equals(me.getId()))
                .findFirst()
                .orElse(null);

        User partnerUser = partner != null ? partner.getUser() : null;

        LocalDate createdDate = conference.getCreatedAt() != null ? conference.getCreatedAt().toLocalDate() : null;
        long durationMinutes = calculateDurationMinutes(conference.getStartedAt(), conference.getEndedAt());

        Boolean isOnline = partnerUser != null ? connectedUserIds.contains(partnerUser.getId()) : null;
        Boolean isBlocked = partnerUser != null ? blockedUserIds.contains(partnerUser.getId()) : null;

        return new ConferenceHistoryItemDto(
                conference.getId(),
                conference.getCurrentRound(),
                createdDate,
                durationMinutes,
                computeUnreadCount(conference, participant, me),
                partnerUser != null ? partnerUser.getId() : null,
                partnerUser != null ? partnerUser.getNickname() : null,
                partnerUser != null ? partnerUser.getProfileImageUrl() : null,
                partnerUser != null ? partnerUser.getClarityScore() : null,
                isOnline,
                isBlocked
        );
    }

    private Set<UUID> fetchBlockedUserIds(User me, Map<UUID, List<ConferenceParticipant>> participantsByConference) {
        Set<UUID> partnerIds = participantsByConference.values().stream()
                .flatMap(List::stream)
                .map(ConferenceParticipant::getUser)
                .filter(user -> !user.getId().equals(me.getId()))
                .map(User::getId)
                .collect(Collectors.toSet());

        if (partnerIds.isEmpty()) {
            return Collections.emptySet();
        }

        return new HashSet<>(userBlockRepository.findBlockedIdsByBlockerAndBlockedIdIn(me, partnerIds));
    }

    private ConferenceHistorySummaryDto buildSummary(User user) {
        long totalMatches = conferenceParticipantRepository.countByUser(user);
        long totalMinutes = conferenceParticipantRepository.findConferencesByUser(user).stream()
                .mapToLong(c -> calculateDurationMinutes(c.getStartedAt(), c.getEndedAt()))
                .sum();

        return new ConferenceHistorySummaryDto(
                totalMatches,
                totalMinutes,
                user.getClarityScore()
        );
    }

    private long calculateDurationMinutes(LocalDateTime startedAt, LocalDateTime endedAt) {
        if (startedAt == null) {
            return 0L;
        }
        LocalDateTime effectiveEnd = endedAt != null ? endedAt : LocalDateTime.now();
        return Math.max(0L, Duration.between(startedAt, effectiveEnd).toMinutes());
    }

    private long computeUnreadCount(Conference conference, ConferenceParticipant participant, User me) {
        LocalDateTime lastReadAt = participant.getLastReadAt();
        if (lastReadAt == null) {
            return chatMessageRepository.countOtherMessages(conference.getId(), me.getId());
        }

        return chatMessageRepository.countOtherMessagesAfter(conference.getId(), me.getId(), lastReadAt);
    }


    @Transactional(readOnly = true)
    public PartnerProfileResponseDto getPartnerProfile(UUID conferenceId) {
        String email = SecurityUtil.getCurrentUserEmail()
                .orElseThrow(() -> new BaseException(ErrorCode.UNAUTHORIZED));

        User me = userRepository.findByEmail(email)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        List<ConferenceParticipant> participants = conferenceParticipantRepository
                .findByConferenceId(conferenceId);

        // 내가 참가자인지 검증
        participants.stream()
                .filter(p -> p.getUser().getId().equals(me.getId()))
                .findFirst()
                .orElseThrow(() -> new BaseException(ErrorCode.CONFERENCE_NOT_PARTICIPANT));

        // 상대방 찾기
        User partner = participants.stream()
                .map(ConferenceParticipant::getUser)
                .filter(u -> !u.getId().equals(me.getId()))
                .findFirst()
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        List<PartnerProfileResponseDto.RoundSummaryDto> roundSummaries = conferenceRoundRepository
                .findByConference_IdOrderByRoundNumberAsc(conferenceId).stream()
                .map(round -> new PartnerProfileResponseDto.RoundSummaryDto(
                        round.getRoundNumber(),
                        round.getSummaryText()
                ))
                .toList();

        return PartnerProfileResponseDto.from(partner, roundSummaries);
    }
}
