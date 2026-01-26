package com.ssafy.unblur.domain.match.controller;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.common.util.SecurityUtil;
import com.ssafy.unblur.domain.match.dto.ConferenceHistoryResponseDto;
import com.ssafy.unblur.domain.match.service.ConferenceHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/history")
@RequiredArgsConstructor
public class ConferenceHistoryController implements ConferenceHistoryApiDocs {

    private final ConferenceHistoryService conferenceHistoryService;

    @GetMapping
    @Override
    public ResponseEntity<BaseResponse<ConferenceHistoryResponseDto>> getMyConferenceHistory(Pageable pageable) {
        String currentUserEmail = SecurityUtil.getCurrentUserEmail()
                .orElseThrow(() -> new BaseException(ErrorCode.UNAUTHORIZED));

        ConferenceHistoryResponseDto response = conferenceHistoryService.getMyConferenceHistory(currentUserEmail, pageable);

        return ResponseEntity.ok(
                new BaseResponse<>(200, "컨퍼런스 이력 조회 성공", response)
        );
    }
}
