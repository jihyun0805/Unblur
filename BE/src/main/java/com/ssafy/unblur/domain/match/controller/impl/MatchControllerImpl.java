package com.ssafy.unblur.domain.match.controller.impl;

import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.common.security.auth.CustomUserDetails;
import com.ssafy.unblur.domain.match.controller.MatchController;
import com.ssafy.unblur.domain.match.dto.FastMatchingRequest;
import com.ssafy.unblur.domain.match.dto.MatchingQueueResponse;
import com.ssafy.unblur.domain.match.dto.OneOnOneMatchRequest;
import com.ssafy.unblur.domain.match.dto.OneOnOneMatchResponse;
import com.ssafy.unblur.domain.match.service.MatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/match")
@RequiredArgsConstructor
public class MatchControllerImpl implements MatchController {

    private final MatchService matchService;

    @Override
    @PostMapping("/quick")
    public ResponseEntity<BaseResponse<MatchingQueueResponse>> startQuickMatch(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody FastMatchingRequest request
    ) {
        MatchingQueueResponse response = matchService.startQuickMatch(userDetails.getUserId(), request);
        return ResponseEntity.ok(
                BaseResponse.onSuccess("빠른 매칭 요청이 성공적으로 처리되었습니다.", response)
        );
    }

    @Override
    @PostMapping("/one-on-one")
    public ResponseEntity<BaseResponse<OneOnOneMatchResponse>> startOneOnOneMatch(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody OneOnOneMatchRequest request
    ) {
        OneOnOneMatchResponse response = matchService.startOneOnOneMatch(
                userDetails.getUserId(), request
        );
        return ResponseEntity.ok(
                BaseResponse.onSuccess("1:1 매칭 요청이 성공적으로 처리되었습니다.", response)
        );
    }

    @Override
    @GetMapping("/queue/status")
    public ResponseEntity<BaseResponse<MatchingQueueResponse>> getQueueStatus(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        MatchingQueueResponse response = matchService.getQueueStatus(userDetails.getUserId());
        return ResponseEntity.ok(
                BaseResponse.onSuccess("매칭 대기열 상태 조회가 성공적으로 처리되었습니다.", response)
        );
    }

    @Override
    @DeleteMapping("/queue/{request_id}")
    public ResponseEntity<BaseResponse<Object>> cancelQuickMatch(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("request_id") String requestId
    ) {
        matchService.cancelQuickMatch(userDetails.getUserId(), requestId);
        return ResponseEntity.ok(
                BaseResponse.onSuccess("빠른 매칭 요청이 성공적으로 취소되었습니다.", null)
        );
    }

    @Override
    @PostMapping("/one-on-one/{request_id}/accept")
    public ResponseEntity<BaseResponse<OneOnOneMatchResponse>> acceptOneOnOne(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("request_id") String requestId
    ) {
        OneOnOneMatchResponse response = matchService.acceptOneOnOneMatch(
                userDetails.getUserId(), requestId
        );
        return ResponseEntity.ok(
                BaseResponse.onSuccess("1:1 매칭 요청이 성공적으로 수락되었습니다.", response)
        );
    }

    @Override
    @PostMapping("/one-on-one/{request_id}/decline")
    public ResponseEntity<BaseResponse<OneOnOneMatchResponse>> declineOneOnOne(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("request_id") String requestId
    ) {
        OneOnOneMatchResponse response = matchService.declineOneOnOneMatch(
                userDetails.getUserId(), requestId
        );
        return ResponseEntity.ok(
                BaseResponse.onSuccess("1:1 매칭 요청이 성공적으로 거절되었습니다.", response)
        );
    }

}
