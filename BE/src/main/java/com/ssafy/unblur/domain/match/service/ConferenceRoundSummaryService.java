package com.ssafy.unblur.domain.match.service;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.domain.match.model.ConferenceRound;
import com.ssafy.unblur.domain.match.repository.ConferenceRoundRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConferenceRoundSummaryService {

    private final ConferenceRoundRepository conferenceRoundRepository;

    @Transactional
    public void saveSummary(UUID conferenceId, Integer roundNumber, String summaryText) {
        ConferenceRound round = conferenceRoundRepository
                .findByConference_IdAndRoundNumber(conferenceId, roundNumber)
                .orElseThrow(() -> new BaseException(ErrorCode.CONFERENCE_NOT_FOUND));

        round.updateSummary(summaryText);
    }
}
