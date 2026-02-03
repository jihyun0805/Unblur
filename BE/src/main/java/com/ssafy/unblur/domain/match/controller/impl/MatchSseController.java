package com.ssafy.unblur.domain.match.controller.impl;

import com.ssafy.unblur.common.security.auth.CustomUserDetails;
import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.domain.match.controller.MatchSseDocs;
import com.ssafy.unblur.common.service.SseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
 * 留ㅼ묶 SSE 援щ룆 而⑦듃濡ㅻ윭
 */
@RestController
@RequestMapping("/api/v1/match")
@RequiredArgsConstructor
@Slf4j
public class MatchSseController implements MatchSseDocs {

    private final SseService sseService;

    @Override
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter connect(@AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            if (userDetails == null) {
                throw new IllegalStateException("SSE ?ъ슜???뺣낫媛 ?놁뒿?덈떎.");
            }

            log.info("SSE 援щ룆 ?붿껌. userId={}", userDetails.getUserId());
            return sseService.connect(userDetails.getUserId());

        } catch (Exception e) {
            log.warn("SSE 援щ룆 ?ㅻ쪟. error={}", e.toString());
            SseEmitter emitter = new SseEmitter(0L);
            emitter.completeWithError(e);
            return emitter;
        }
    }

    @Override
    @DeleteMapping("/stream")
    public ResponseEntity<BaseResponse<Void>> disconnect(@AuthenticationPrincipal CustomUserDetails userDetails) {
        log.info("SSE 援щ룆 ?댁젣 ?붿껌. userId={}", userDetails.getUserId());

        sseService.disconnect(userDetails.getUserId());
        return ResponseEntity.status(HttpStatus.NO_CONTENT)
                .body(BaseResponse.onNoContent("留ㅼ묶 ?곹깭 ?ㅽ듃由??곌껐???댁젣?섏뿀?듬땲??")
                );
    }
}
