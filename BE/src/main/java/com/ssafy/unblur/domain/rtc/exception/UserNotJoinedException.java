package com.ssafy.unblur.domain.rtc.exception;

import java.util.UUID;

/**
 * 방에 참여하지 않은 사용자가 접근했을 때 발생하는 예외
 */
public class UserNotJoinedException extends IllegalStateException {

    public UserNotJoinedException(UUID userId) {
        super("User not joined: " + userId);
    }
}
