package com.ssafy.unblur.domain.match.controller.impl;

import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.common.security.auth.CustomUserDetails;
import com.ssafy.unblur.domain.match.controller.ConferenceController;
import com.ssafy.unblur.domain.match.dto.AdvanceRoundRequest;
import com.ssafy.unblur.domain.match.dto.AdvanceRoundResponse;
import com.ssafy.unblur.domain.match.service.ConferenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * 세션(컨퍼런스) 라운드 관리 컨트롤러
 */
@RestController
@RequestMapping("/api/v1/conference")
@RequiredArgsConstructor
public class ConferenceControllerImpl implements ConferenceController {

    private final ConferenceService conferenceService;

    /**
     * 다음 라운드 진행 API
     *
     * @param userDetails  인증 사용자 정보
     * @param conferenceId 세션 ID
     * @param request      요청 DTO
     * @return 다음 라운드 정보
     */
    @Override
    @PostMapping("/{conference_id}/advance-round")
    public ResponseEntity<BaseResponse<AdvanceRoundResponse>> advanceRound(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("conference_id") String conferenceId,
            @Valid @RequestBody AdvanceRoundRequest request
    ) {
        AdvanceRoundResponse response = conferenceService.advanceRound(
                UUID.fromString(conferenceId),
                userDetails.getUserId(),
                request.proceed()
        );

        return ResponseEntity.ok(BaseResponse.success(200, "OK", response));
    }
}
