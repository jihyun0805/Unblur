package com.ssafy.unblur.domain.rtc.config;

import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kurento.client.KurentoClient;

/**
 * Kurento 클라이언트를 제공하는 클래스
 */
@Slf4j
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
                log.info("KurentoClient가 존재하지 않음, 새로 생성 중...");
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
            destroyInternal();
            log.warn("KurentoClient 재생성: {}", kurentoWsUri);
            client = KurentoClient.create(kurentoWsUri);
            return client;
        }
    }

    /**
     * Spring Context 종료 시 KurentoClient를 종료하는 메서드
     */
    @PreDestroy
    public void shutdown() {
        synchronized (lock) {
            log.info("Spring Context 종료 - KurentoClient 종료 중");
            destroyInternal();
        }
    }

    /**
     * 내부적으로 KurentoClient를 종료하는 메서드
     */
    private void destroyInternal() {
        if (client != null) {
            try {
                client.destroy();

            } catch (Exception e) {
                log.warn("KurentoClient 종료 실패", e);

            } finally {
                client = null;
            }
        }
    }
}
