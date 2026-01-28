package com.ssafy.unblur.domain.chat.controller;

import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.domain.chat.dto.event.ChatReadEventDto;
import com.ssafy.unblur.domain.chat.dto.request.ChatReadRequestDto;
import com.ssafy.unblur.domain.chat.dto.request.ChatSendRequestDto;
import com.ssafy.unblur.domain.chat.dto.response.ChatMessagePageResponseDto;
import com.ssafy.unblur.domain.chat.dto.response.ChatMessageResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import java.util.UUID;

@Tag(name = "Chat", description = "대화방 채팅 API")
public interface ChatMessageApiDocs {

    @Operation(
            summary = "대화방 메시지 조회",
            description = "로그인한 사용자가 참여한 대화방의 채팅 메시지를 페이징 조회합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "접근 권한 없음"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    @Parameter(name = "conferenceId", description = "대화방 ID")
    @Parameter(name = "page", description = "페이지 번호 (0부터 시작)", example = "0")
    @Parameter(name = "size", description = "페이지 크기 (기본 100)", example = "100")
    ResponseEntity<BaseResponse<ChatMessagePageResponseDto>> getMessages(
            UUID conferenceId,
            @Parameter(hidden = true) Pageable pageable
    );

    @Operation(
            summary = "대화방 메시지 전송",
            description = "대화방에 메시지를 전송하고, 저장된 메시지를 반환합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "전송 성공"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "접근 권한 없음"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    ResponseEntity<BaseResponse<ChatMessageResponseDto>> sendMessage(
            @Parameter(description = "대화방 ID") UUID conferenceId,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "메시지 전송 요청",
                    required = true,
                    content = @Content(schema = @Schema(implementation = ChatSendRequestDto.class))
            )
            ChatSendRequestDto request
    );

    @Operation(
            summary = "대화방 읽음 처리",
            description = "마지막으로 읽은 시각을 전달해 읽음 상태를 갱신합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "읽음 처리 성공"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "접근 권한 없음"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    ResponseEntity<BaseResponse<ChatReadEventDto>> markAsRead(
            @Parameter(description = "대화방 ID") UUID conferenceId,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "읽음 처리 요청",
                    required = true,
                    content = @Content(schema = @Schema(implementation = ChatReadRequestDto.class))
            )
            ChatReadRequestDto request
    );
}
