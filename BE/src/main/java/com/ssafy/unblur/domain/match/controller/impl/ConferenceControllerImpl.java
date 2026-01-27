package com.ssafy.unblur.domain.match.controller.impl;

import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.common.security.auth.CustomUserDetails;
import com.ssafy.unblur.domain.match.controller.ConferenceController;
import com.ssafy.unblur.domain.match.dto.AdvanceRoundRequest;
import com.ssafy.unblur.domain.match.dto.AdvanceRoundResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 세션(컨퍼런스) 라운드 관리 컨트롤러
 */
@RestController
@RequestMapping("/api/v1/conference")
@RequiredArgsConstructor
public class ConferenceControllerImpl implements ConferenceController {

    /**
     * 다음 라운드 진행 API
     * <p>
     * TODO: 실제 라운드 전환 로직 구현 필요
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
        // TODO: 실제 구현 - ConferenceService.advanceRound() 호출
        // 1. 세션 조회 및 권한 검증
        // 2. 현재 라운드 종료 처리
        // 3. proceed=true면 다음 라운드 시작, false면 세션 종료
        // 4. SSE로 상대방에게 알림

        // 더미 응답
        AdvanceRoundResponse response = AdvanceRoundResponse.builder()
                .conferenceId(conferenceId)
                .currentRound(request.proceed() ? 2 : 1)
                .status(request.proceed() ? "active" : "completed")
                .build();

        return ResponseEntity.ok(BaseResponse.success(200, "OK", response));
    }
}
