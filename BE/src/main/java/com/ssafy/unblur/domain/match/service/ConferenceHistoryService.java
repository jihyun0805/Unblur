package com.ssafy.unblur.domain.match.service;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.auth.repository.UserRepository;
import com.ssafy.unblur.domain.match.dto.ConferenceHistoryItemDto;
import com.ssafy.unblur.domain.match.dto.ConferenceHistoryResponseDto;
import com.ssafy.unblur.domain.match.dto.ConferenceHistorySummaryDto;
import com.ssafy.unblur.domain.match.model.Conference;
import com.ssafy.unblur.domain.match.model.ConferenceParticipant;
import com.ssafy.unblur.domain.match.repository.ConferenceParticipantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConferenceHistoryService {

    private final UserRepository userRepository;
    private final ConferenceParticipantRepository conferenceParticipantRepository;

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

        List<ConferenceHistoryItemDto> items = page.getContent().stream()
                .map(cp -> toHistoryItem(cp, user, participantsByConference))
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
            Map<UUID, List<ConferenceParticipant>> participantsByConference
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

        return new ConferenceHistoryItemDto(
                conference.getId(),
                conference.getCurrentRound(),
                createdDate,
                durationMinutes,
                partnerUser != null ? partnerUser.getNickname() : null,
                partnerUser != null ? partnerUser.getProfileImageUrl() : null,
                partnerUser != null ? partnerUser.getClarityScore() : null
        );
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
}

