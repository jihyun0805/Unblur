package com.ssafy.unblur.domain.match.controller.impl;

import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.common.security.auth.CustomUserDetails;
import com.ssafy.unblur.domain.match.controller.MatchApiDocs;
import com.ssafy.unblur.domain.match.dto.request.FastMatchingRequest;
import com.ssafy.unblur.domain.match.dto.request.OneOnOneMatchRequest;
import com.ssafy.unblur.domain.match.dto.response.MatchingQueueResponse;
import com.ssafy.unblur.domain.match.dto.response.OneOnOneMatchResponse;
import com.ssafy.unblur.domain.match.dto.response.OneOnOneMatchedResponse;
import com.ssafy.unblur.domain.match.dto.response.OnlineUserListResponse;
import com.ssafy.unblur.domain.auth.model.LoveDna;
import com.ssafy.unblur.domain.match.service.MatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/match")
@RequiredArgsConstructor
public class MatchController implements MatchApiDocs {

    private final MatchService matchService;

    @Override
    @PostMapping("/quick")
    public ResponseEntity<BaseResponse<MatchingQueueResponse>> startQuickMatch(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody FastMatchingRequest request
    ) {
        log.info("API 빠른 매칭 요청. userId={}", userDetails.getUserId());

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
        log.info("API 1:1 매칭 요청. userId={}, targetUserId={}", userDetails.getUserId(), request.targetUserId());

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
        log.debug("API 대기열 상태 조회. userId={}", userDetails.getUserId());

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
        log.info("API 빠른 매칭 취소. userId={}, requestId={}", userDetails.getUserId(), requestId);

        matchService.cancelQuickMatch(userDetails.getUserId(), requestId);
        return ResponseEntity.ok(
                BaseResponse.onSuccess("빠른 매칭 요청이 성공적으로 취소되었습니다.", null)
        );
    }

    @Override
    @PostMapping("/one-on-one/{request_id}/accept")
    public ResponseEntity<BaseResponse<OneOnOneMatchedResponse>> acceptOneOnOne(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("request_id") String requestId
    ) {
        log.info("API 1:1 매칭 수락. userId={}, requestId={}", userDetails.getUserId(), requestId);

        OneOnOneMatchedResponse response = matchService.acceptOneOnOneMatch(
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
        log.info("API 1:1 매칭 거절. userId={}, requestId={}", userDetails.getUserId(), requestId);

        OneOnOneMatchResponse response = matchService.declineOneOnOneMatch(
                userDetails.getUserId(), requestId
        );
        return ResponseEntity.ok(
                BaseResponse.onSuccess("1:1 매칭 요청이 성공적으로 거절되었습니다.", response)
        );
    }

    @Override
    @DeleteMapping("/one-on-one")
    public ResponseEntity<BaseResponse<OneOnOneMatchResponse>> cancelOneOnOneMatch(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        log.info("API 1:1 매칭 취소. userId={}", userDetails.getUserId());

        OneOnOneMatchResponse response = matchService.cancelOneOnOneMatch(userDetails.getUserId());
        return ResponseEntity.ok(
            BaseResponse.onSuccess("1:1 매칭 요청이 성공적으로 취소되었습니다.", response)
        );
    }

    @GetMapping("/online-users")
    public ResponseEntity<BaseResponse<OnlineUserListResponse>> getOnlineUsers(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "3") int limit,
            @RequestParam(required = false) LoveDna loveDna
    ) {
        log.debug("API 온라인 사용자 목록 조회. userId={}, limit={}, loveDna={}", userDetails.getUserId(), limit, loveDna);

        OnlineUserListResponse response = matchService.getRandomOnlineUsers(userDetails.getUserId(), limit, loveDna);
        return ResponseEntity.ok(
                BaseResponse.onSuccess("온라인 사용자 목록 조회 성공", response)
        );
    }

}
