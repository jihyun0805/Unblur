package com.ssafy.unblur.domain.chat.service;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.domain.chat.dto.ChatMessagePageResponseDto;
import com.ssafy.unblur.domain.chat.dto.ChatReadEventDto;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class ChatMessageService {

    public ChatMessagePageResponseDto getMessages(UUID conferenceId, Pageable pageable, String email) {
        // TODO: 조회 로직 구현 (conference/participant 검증 포함)
        throw new BaseException(ErrorCode.INTERNAL_SERVER_ERROR);
    }

    public ChatReadEventDto markAsRead(UUID conferenceId, LocalDateTime lastReadAt, String email) {
        // TODO: 읽음 처리 로직 구현 (ACTIVE일 때 자동 처리 포함)
        throw new BaseException(ErrorCode.INTERNAL_SERVER_ERROR);
    }
}