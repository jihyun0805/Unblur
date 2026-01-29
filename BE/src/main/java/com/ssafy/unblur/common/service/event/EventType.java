package com.ssafy.unblur.common.service.event;

/**
 * 매칭 이벤트 타입 마커 인터페이스
 * <p>
 * SSE와 WebSocket 이벤트 타입이 공통으로 구현한다
 */
public interface EventType {

    /**
     * 이벤트 이름을 반환하는 메서드
     *
     * @return 이벤트 이름
     */
    String eventName();
}
