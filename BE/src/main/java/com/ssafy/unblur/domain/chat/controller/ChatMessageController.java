package com.ssafy.unblur.domain.chat.controller;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.common.util.SecurityUtil;
import com.ssafy.unblur.domain.chat.dto.ChatMessagePageResponseDto;
import com.ssafy.unblur.domain.chat.dto.ChatReadEventDto;
import com.ssafy.unblur.domain.chat.dto.ChatReadRequestDto;
import com.ssafy.unblur.domain.chat.service.ChatMessageService;
import io.swagger.v3.oas.annotations.Parameter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/conferences/{conferenceId}")
@RequiredArgsConstructor
public class ChatMessageController {

    private final ChatMessageService chatMessageService;

    @GetMapping("/messages")
    public ResponseEntity<BaseResponse<ChatMessagePageResponseDto>> getMessages(
            @PathVariable UUID conferenceId,
            @Parameter(hidden = true) Pageable pageable
    ) {
        String email = SecurityUtil.getCurrentUserEmail()
                .orElseThrow(() -> new BaseException(ErrorCode.UNAUTHORIZED));

        ChatMessagePageResponseDto response = chatMessageService.getMessages(conferenceId, pageable, email);
        return ResponseEntity.ok(new BaseResponse<>(200, "대화방 메시지 조회 성공", response));
    }

    @PostMapping("/read")
    public ResponseEntity<BaseResponse<ChatReadEventDto>> markAsRead(
            @PathVariable UUID conferenceId,
            @RequestBody ChatReadRequestDto request
    ) {
        String email = SecurityUtil.getCurrentUserEmail()
                .orElseThrow(() -> new BaseException(ErrorCode.UNAUTHORIZED));

        ChatReadEventDto response = chatMessageService.markAsRead(conferenceId, request.lastReadAt(), email);
        return ResponseEntity.ok(new BaseResponse<>(200, "읽음 처리 성공", response));
    }
}
