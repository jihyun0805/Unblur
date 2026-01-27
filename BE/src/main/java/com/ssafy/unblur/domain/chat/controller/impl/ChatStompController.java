package com.ssafy.unblur.domain.chat.controller.impl;

import com.ssafy.unblur.domain.chat.dto.request.ChatSendRequestDto;
import com.ssafy.unblur.domain.chat.dto.response.ChatMessageResponseDto;
import com.ssafy.unblur.domain.chat.service.ChatMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class ChatStompController {

    private final ChatMessageService chatMessageService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/conferences/{conferenceId}/chat")
    public void sendMessage(
            @DestinationVariable UUID conferenceId,
            ChatSendRequestDto request,
            Principal principal
    ) {
        String email = principal != null ? principal.getName() : null;
        ChatMessageResponseDto response = chatMessageService.sendMessage(conferenceId, request, email);
        messagingTemplate.convertAndSend("/sub/conferences/" + conferenceId, response);
    }
}
