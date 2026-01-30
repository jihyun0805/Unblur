package com.ssafy.unblur.common.util;

import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * 트랜잭션 커밋 이후 실행을 보장하기 위한 유틸리티
 */
public final class TransactionUtils {

    private TransactionUtils() {
    }

    /**
     * 현재 트랜잭션이 있으면 커밋 이후에 실행하고, 없으면 즉시 실행하는 메서드
     */
    public static void runAfterCommit(Runnable task) {
        if (task == null) {
            return;
        }

        if (!TransactionSynchronizationManager.isActualTransactionActive()) {
            task.run();
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                task.run();
            }
        });
    }
}
