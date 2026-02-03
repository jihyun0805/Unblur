package com.ssafy.unblur.domain.match.controller.impl;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.common.util.SecurityUtil;
import com.ssafy.unblur.domain.match.controller.ConferenceHistoryApiDocs;
import com.ssafy.unblur.domain.match.dto.response.ConferenceHistoryResponseDto;
import com.ssafy.unblur.domain.match.dto.response.PartnerProfileResponseDto;
import com.ssafy.unblur.domain.match.service.ConferenceHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/history")
@RequiredArgsConstructor
public class ConferenceHistoryController implements ConferenceHistoryApiDocs {

    private final ConferenceHistoryService conferenceHistoryService;

    @GetMapping
    @Override
    public ResponseEntity<BaseResponse<ConferenceHistoryResponseDto>> getMyConferenceHistory(
            @RequestParam(required = false) String search,
            Pageable pageable
    ) {
        String currentUserEmail = SecurityUtil.getCurrentUserEmail()
                .orElseThrow(() -> new BaseException(ErrorCode.UNAUTHORIZED));

        ConferenceHistoryResponseDto response = conferenceHistoryService.getMyConferenceHistory(
                currentUserEmail,
                search,
                pageable
        );

        return ResponseEntity.ok(
                BaseResponse.onSuccess("컨퍼런스 이력 조회에 성공했습니다.", response)
        );
    }

    @GetMapping("/{conference_Id}/partner")
    @Override
    public ResponseEntity<BaseResponse<PartnerProfileResponseDto>> getPartnerProfile(
            @PathVariable UUID conference_Id) {
        PartnerProfileResponseDto response = conferenceHistoryService
                .getPartnerProfile(conference_Id);

        return ResponseEntity.ok(
                BaseResponse.onSuccess("상대방 프로필 조회 성공", response));
    }

}
