package com.ssafy.unblur.domain.match.controller.impl;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.common.util.SecurityUtil;
import com.ssafy.unblur.domain.match.controller.ConferenceClarityEvaluationApiDocs;
import com.ssafy.unblur.domain.match.dto.ClarityEvaluationRequest;
import com.ssafy.unblur.domain.match.service.ClarityEvaluationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/conferences/{conferenceId}")
@RequiredArgsConstructor
public class ConferenceClarityEvaluationController implements ConferenceClarityEvaluationApiDocs {

    private final ClarityEvaluationService clarityEvaluationService;

    @PostMapping("/clarity-evaluations")
    @Override
    public ResponseEntity<BaseResponse<Void>> evaluateClarity(
            @PathVariable UUID conferenceId,
            @Valid @RequestBody ClarityEvaluationRequest request
    ) {
        String currentUserEmail = SecurityUtil.getCurrentUserEmail()
                .orElseThrow(() -> new BaseException(ErrorCode.UNAUTHORIZED));

        clarityEvaluationService.evaluate(conferenceId, currentUserEmail, request.score());

        return ResponseEntity.ok(
                BaseResponse.onSuccess("선명도 평가 성공", null)
        );
    }
}
