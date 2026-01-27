package com.ssafy.unblur.domain.chat.service;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.auth.repository.UserRepository;
import com.ssafy.unblur.domain.chat.dto.ChatMessagePageResponseDto;
import com.ssafy.unblur.domain.chat.dto.ChatMessageResponseDto;
import com.ssafy.unblur.domain.chat.dto.ChatReadEventDto;
import com.ssafy.unblur.domain.chat.model.ChatMessage;
import com.ssafy.unblur.domain.chat.repository.ChatMessageRepository;
import com.ssafy.unblur.domain.match.model.ConferenceParticipant;
import com.ssafy.unblur.domain.match.repository.ConferenceParticipantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private final UserRepository userRepository;
    private final ConferenceParticipantRepository conferenceParticipantRepository;
    private final ChatMessageRepository chatMessageRepository;

    @Transactional(readOnly = true)
    public ChatMessagePageResponseDto getMessages(UUID conferenceId, Pageable pageable, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        ConferenceParticipant participant = conferenceParticipantRepository
                .findByConferenceIdAndUser(conferenceId, user)
                .orElseThrow(() -> new BaseException(ErrorCode.ACCESS_DENIED));

        LocalDateTime partnerLastReadAt = resolvePartnerLastReadAt(conferenceId, user.getId());

        Page<ChatMessage> page = chatMessageRepository.findByConferenceId(conferenceId, pageable);

        List<ChatMessageResponseDto> items = page.getContent().stream()
                .map(message -> toResponse(message, user.getId(), partnerLastReadAt))
                .toList();

        String conferenceStatus = participant.getConference().getStatus().name();

        return new ChatMessagePageResponseDto(
                items,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                conferenceStatus
        );
    }

    @Transactional
    public ChatReadEventDto markAsRead(UUID conferenceId, LocalDateTime lastReadAt, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        conferenceParticipantRepository.findByConferenceIdAndUser(conferenceId, user)
                .orElseThrow(() -> new BaseException(ErrorCode.ACCESS_DENIED));

        LocalDateTime readAt = lastReadAt != null ? lastReadAt : LocalDateTime.now();
        conferenceParticipantRepository.updateLastReadAt(conferenceId, user, readAt);

        return new ChatReadEventDto(readAt);
    }

    private LocalDateTime resolvePartnerLastReadAt(UUID conferenceId, UUID userId) {
        return conferenceParticipantRepository.findByConferenceId(conferenceId).stream()
                .filter(cp -> cp.getUser() != null && !cp.getUser().getId().equals(userId))
                .map(ConferenceParticipant::getLastReadAt)
                .findFirst()
                .orElse(null);
    }

    private ChatMessageResponseDto toResponse(ChatMessage message, UUID meId, LocalDateTime partnerLastReadAt) {
        String type = message.getMessageType() != null ? message.getMessageType().name() : null;
        UUID senderId = message.getUser() != null ? message.getUser().getId() : null;
        boolean isMine = senderId != null && senderId.equals(meId);
        boolean isReadByPartner = !isMine;
        if (isMine && partnerLastReadAt != null && message.getCreatedAt() != null) {
            isReadByPartner = !message.getCreatedAt().isAfter(partnerLastReadAt);
        }

        return new ChatMessageResponseDto(
                message.getId(),
                senderId,
                message.getUser() != null ? message.getUser().getNickname() : null,
                type,
                message.getContent(),
                message.getCreatedAt(),
                isReadByPartner
        );
    }
}
