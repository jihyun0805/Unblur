package com.ssafy.unblur.domain.chat.controller.impl;

import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.domain.chat.controller.ChatMessageApiDocs;
import com.ssafy.unblur.domain.chat.dto.event.ChatReadEventDto;
import com.ssafy.unblur.domain.chat.dto.request.ChatReadRequestDto;
import com.ssafy.unblur.domain.chat.dto.request.ChatSendRequestDto;
import com.ssafy.unblur.domain.chat.dto.response.ChatMessagePageResponseDto;
import com.ssafy.unblur.domain.chat.dto.response.ChatMessageResponseDto;
import com.ssafy.unblur.domain.chat.service.ChatMessageService;
import io.swagger.v3.oas.annotations.Parameter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
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
public class ChatMessageController implements ChatMessageApiDocs {

    private final ChatMessageService chatMessageService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/messages")
    public ResponseEntity<BaseResponse<ChatMessagePageResponseDto>> getMessages(
            @PathVariable UUID conferenceId,
            @Parameter(hidden = true)
            @PageableDefault(size = 100, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        ChatMessagePageResponseDto response = chatMessageService.getMessages(conferenceId, pageable);
        return ResponseEntity.ok(BaseResponse.onSuccess("대화방 메시지 조회 성공", response));
    }

    @PostMapping("/read")
    public ResponseEntity<BaseResponse<ChatReadEventDto>> markAsRead(
            @PathVariable UUID conferenceId,
            @RequestBody ChatReadRequestDto request
    ) {
        ChatReadEventDto response = chatMessageService.markAsRead(conferenceId, request.lastReadAt());
        messagingTemplate.convertAndSend("/sub/conferences/" + conferenceId, response);
        return ResponseEntity.ok(BaseResponse.onSuccess("읽음 처리 성공", response));
    }

    @PostMapping("/messages")
    public ResponseEntity<BaseResponse<ChatMessageResponseDto>> sendMessage(
            @PathVariable UUID conferenceId,
            @RequestBody ChatSendRequestDto request
    ) {
        ChatMessageResponseDto response = chatMessageService.sendMessage(conferenceId, request);
        messagingTemplate.convertAndSend("/sub/conferences/" + conferenceId, response);
        return ResponseEntity.ok(BaseResponse.onSuccess("대화방 메시지 전송 성공", response));
    }
}
