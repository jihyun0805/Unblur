package com.ssafy.unblur.domain.rtc.exception;

/**
 * ICE candidate 전송 실패 예외
 */
public class IceCandidateSendException extends RuntimeException {

    public IceCandidateSendException(String message, Throwable cause) {
        super(message, cause);
    }
}
