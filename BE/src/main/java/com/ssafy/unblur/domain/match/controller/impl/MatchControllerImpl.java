package com.ssafy.unblur.domain.match.controller.impl;

import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.domain.match.controller.MatchController;
import com.ssafy.unblur.domain.match.dto.FastMatchingRequest;
import com.ssafy.unblur.domain.match.dto.MatchingQueueResponse;
import com.ssafy.unblur.domain.match.dto.OneOnOneMatchRequest;
import com.ssafy.unblur.domain.match.dto.OneOnOneMatchResponse;

import java.time.LocalDateTime;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
@RequestMapping("/api/v1/match")
public class MatchControllerImpl implements MatchController {

    @Override
    @PostMapping("/quick")
    public ResponseEntity<BaseResponse<MatchingQueueResponse>> startQuickMatch(@Valid @RequestBody FastMatchingRequest request) {
        MatchingQueueResponse response = new MatchingQueueResponse(
                "queue-id",
                "waiting",
                true,
                5,
                300,
                "quick",
                128,
                LocalDateTime.parse("2024-01-14T14:30:00")
        );

        return ResponseEntity.ok(BaseResponse.success(200, "OK", response));
    }

    @Override
    @PostMapping("/one-on-one")
    public ResponseEntity<BaseResponse<OneOnOneMatchResponse>> startOneOnOneMatch(@Valid @RequestBody OneOnOneMatchRequest request) {
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
    public ResponseEntity<BaseResponse<MatchingQueueResponse>> getQueueStatus() {
        MatchingQueueResponse response = new MatchingQueueResponse(
                "queue-id",
                "waiting",
                true,
                5,
                300,
                "quick",
                128,
                LocalDateTime.parse("2024-01-14T14:30:00")
        );

        return ResponseEntity.ok(BaseResponse.success(200, "OK", response));
    }

    @Override
    @DeleteMapping("/queue/{request_id}")
    public ResponseEntity<BaseResponse<Object>> cancelQuickMatch(@PathVariable("request_id") String requestId) {
        return ResponseEntity.ok(BaseResponse.success(200, "OK", null));
    }

    @Override
    @PostMapping("/one-on-one/{request_id}/accept")
    public ResponseEntity<BaseResponse<OneOnOneMatchResponse>> acceptOneOnOne(@PathVariable("request_id") String requestId) {
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
    public ResponseEntity<BaseResponse<OneOnOneMatchResponse>> declineOneOnOne(@PathVariable("request_id") String requestId) {
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
