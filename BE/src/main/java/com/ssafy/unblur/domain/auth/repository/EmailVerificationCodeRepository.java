package com.ssafy.unblur.domain.auth.repository;

import com.ssafy.unblur.domain.auth.model.EmailVerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface EmailVerificationCodeRepository extends JpaRepository<EmailVerificationCode, UUID> {

    Optional<EmailVerificationCode> findTopByEmailOrderByCreatedAtDesc(String email);

    void deleteByEmail(String email);
}
