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

import java.time.LocalDateTime;

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
        return ResponseEntity.ok(BaseResponse.success(200, "OK", response));
    }

    @Override
    @PostMapping("/one-on-one")
    public ResponseEntity<BaseResponse<OneOnOneMatchResponse>> startOneOnOneMatch(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody OneOnOneMatchRequest request
    ) {
        OneOnOneMatchResponse response = new OneOnOneMatchResponse(
                "queue-id",
                "waiting",
                "one-on-one",
                request.getTargetUserId(),
                "pending",
                60,
                LocalDateTime.parse("2024-01-14T14:30:00")
        );

        return ResponseEntity.ok(BaseResponse.success(200, "OK", response));
    }

    @Override
    @GetMapping("/queue/status")
    public ResponseEntity<BaseResponse<MatchingQueueResponse>> getQueueStatus(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        MatchingQueueResponse response = matchService.getQueueStatus(userDetails.getUserId());
        return ResponseEntity.ok(BaseResponse.success(200, "OK", response));
    }

    @Override
    @DeleteMapping("/queue/{request_id}")
    public ResponseEntity<BaseResponse<Object>> cancelQuickMatch(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("request_id") String requestId
    ) {
        matchService.cancelQuickMatch(userDetails.getUserId(), requestId);
        return ResponseEntity.ok(BaseResponse.success(200, "OK", null));
    }

    @Override
    @PostMapping("/one-on-one/{request_id}/accept")
    public ResponseEntity<BaseResponse<OneOnOneMatchResponse>> acceptOneOnOne(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("request_id") String requestId
    ) {
        OneOnOneMatchResponse response = new OneOnOneMatchResponse(
                requestId,
                "matched",
                "one-on-one",
                "0f4d8f6a-8df6-4fa9-9b9d-2b3bcd0b7b8f",
                "accepted",
                null,
                LocalDateTime.parse("2024-01-14T14:30:00")
        );

        return ResponseEntity.ok(BaseResponse.success(200, "OK", response));
    }

    @Override
    @PostMapping("/one-on-one/{request_id}/decline")
    public ResponseEntity<BaseResponse<OneOnOneMatchResponse>> declineOneOnOne(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("request_id") String requestId
    ) {
        OneOnOneMatchResponse response = new OneOnOneMatchResponse(
                requestId,
                "canceled",
                "one-on-one",
                "0f4d8f6a-8df6-4fa9-9b9d-2b3bcd0b7b8f",
                "declined",
                null,
                LocalDateTime.parse("2024-01-14T14:30:00")
        );

        return ResponseEntity.ok(BaseResponse.success(200, "OK", response));
    }

}
