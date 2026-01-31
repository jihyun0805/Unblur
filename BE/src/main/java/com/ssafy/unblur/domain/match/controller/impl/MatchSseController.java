package com.ssafy.unblur.domain.match.controller.impl;

import com.ssafy.unblur.common.security.auth.CustomUserDetails;
import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.domain.match.controller.MatchSseDocs;
import com.ssafy.unblur.common.service.SseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * 매칭 SSE 구독 컨트롤러
 */
@RestController
@RequestMapping("/api/v1/match")
@RequiredArgsConstructor
public class MatchSseController implements MatchSseDocs {

    private final SseService sseService;

    @Override
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter connect(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return sseService.connect(userDetails.getUserId());
    }

    @Override
    @DeleteMapping("/stream")
    public ResponseEntity<BaseResponse<Void>> disconnect(@AuthenticationPrincipal CustomUserDetails userDetails) {
        sseService.disconnect(userDetails.getUserId());
        return ResponseEntity.status(HttpStatus.NO_CONTENT)
                .body(BaseResponse.onNoContent("매칭 상태 스트림 연결이 해제되었습니다.")
                );
    }
}
