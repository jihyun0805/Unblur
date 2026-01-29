package com.ssafy.unblur.domain.match.controller;

import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.domain.match.dto.RoundSummarySaveRequestDto;
import com.ssafy.unblur.domain.match.service.ConferenceRoundSummaryService;
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
@RequestMapping("/api/internal/conferences")
@RequiredArgsConstructor
public class InternalConferenceSummaryController {

    private final ConferenceRoundSummaryService conferenceRoundSummaryService;

    @PostMapping("/{conferenceId}/rounds/{roundNumber}/summary")
    public ResponseEntity<BaseResponse<Void>> saveRoundSummary(
            @PathVariable UUID conferenceId,
            @PathVariable Integer roundNumber,
            @Valid @RequestBody RoundSummarySaveRequestDto request
    ) {
        conferenceRoundSummaryService.saveSummary(conferenceId, roundNumber, request.summaryText());
        return ResponseEntity.ok(BaseResponse.onSuccess("라운드 요약 저장 성공", null));
    }
}
