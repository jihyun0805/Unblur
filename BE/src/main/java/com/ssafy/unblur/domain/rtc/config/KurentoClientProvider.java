package com.ssafy.unblur.domain.rtc.config;

import lombok.RequiredArgsConstructor;
import org.kurento.client.KurentoClient;

/**
 * Kurento 클라이언트를 제공하는 클래스
 */
@RequiredArgsConstructor
public class KurentoClientProvider {

    private final String kurentoWsUri;

    private final Object lock = new Object();

    private volatile KurentoClient client;

    /**
     * 기존 클라이언트가 있으면 재사용하고, 없으면 새로 생성하는 메서드
     *
     * @return Kurento 클라이언트
     */
    public KurentoClient get() {
        KurentoClient local = client;
        if (local != null) {
            return local;
        }

        synchronized (lock) {
            if (client == null) {
                client = KurentoClient.create(kurentoWsUri);
            }

            return client;
        }
    }

    /**
     * Kurento 클라이언트를 새로 생성하는 메서드
     *
     * @return 새 Kurento 클라이언트
     */
    public KurentoClient recreate() {
        synchronized (lock) {
            if (client != null) {
                client.destroy();
            }

            client = KurentoClient.create(kurentoWsUri);
            return client;
        }
    }
}
