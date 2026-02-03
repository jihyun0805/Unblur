package com.ssafy.unblur.domain.auth.repository;

import com.ssafy.unblur.domain.auth.model.IdempotencyKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface IdempotencyKeyRepository extends JpaRepository<IdempotencyKey, UUID> {

    /**
     * 만료 시간 이전의 멱등성 키 조회하는 메서드
     *
     * @param traceId 트레이스 아이디
     * @return 멱등성 키 엔티티
     */
    Optional<IdempotencyKey> findByTraceId(String traceId);
}
