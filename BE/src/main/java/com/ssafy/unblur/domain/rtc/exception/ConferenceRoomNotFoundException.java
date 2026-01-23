package com.ssafy.unblur.domain.rtc.exception;

import java.util.UUID;

/**
 * 존재하지 않는 컨퍼런스 방에 접근했을 때 발생하는 예외
 */
public class ConferenceRoomNotFoundException extends IllegalStateException {

    public ConferenceRoomNotFoundException(UUID conferenceId) {
        super("Conference room not found: " + conferenceId);
    }
}
