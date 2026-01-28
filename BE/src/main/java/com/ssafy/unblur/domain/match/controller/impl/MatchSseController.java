package com.ssafy.unblur.domain.match.controller.impl;

import com.ssafy.unblur.common.security.auth.CustomUserDetails;
import com.ssafy.unblur.domain.match.controller.MatchSseDocs;
import com.ssafy.unblur.domain.match.service.MatchSseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    private final MatchSseService matchSseService;

    /**
     * 빠른 매칭 상태를 구독하는 메서드
     *
     * @param userDetails 인증 사용자 정보
     * @return SSE emitter
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter connect(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return matchSseService.connect(userDetails.getUserId());
    }
}
