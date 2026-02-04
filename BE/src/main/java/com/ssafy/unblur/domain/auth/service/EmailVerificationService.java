package com.ssafy.unblur.domain.auth.service;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.domain.auth.model.EmailVerificationCode;
import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.auth.repository.EmailVerificationCodeRepository;
import com.ssafy.unblur.domain.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int CODE_LENGTH = 8;
    private static final String EMAIL_REGEX = "^[A-za-z0-9+_.-]+@(.+)$";

    private final EmailVerificationCodeRepository verificationCodeRepository;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Value("${auth.email.verification.expire-minutes:10}")
    private long expireMinutes;

    @Transactional
    public void sendPasswordResetCode(String email) {
        log.info("비밀번호 재설정 코드 요청 수신. email={}", email);
        validateEmailFormat(email);
        if (userRepository.findByEmail(email).isEmpty()) {
            log.info("비밀번호 재설정 코드 요청: 사용자 미존재로 종료. email={}", email);
            return;
        }

        String code = generateCode();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(expireMinutes);

        verificationCodeRepository.deleteByEmail(email);
        verificationCodeRepository.save(
                EmailVerificationCode.create(email, code, expiresAt)
        );

        log.info("비밀번호 재설정 코드 저장 완료. email={}, expiresAt={}", email, expiresAt);
        emailService.sendPasswordResetCode(email, code);
        log.info("비밀번호 재설정 코드 메일 발송 완료 요청. email={}", email);
    }

    @Transactional
    public void confirmPasswordResetCode(String email, String code) {
        log.info("비밀번호 재설정 코드 검증 요청 수신. email={}, code={}", email, code);
        EmailVerificationCode verificationCode = getLatestCode(email);

        if (verificationCode.isExpired(LocalDateTime.now())) {
            log.warn("비밀번호 재설정 코드 만료. email={}", email);
            throw new BaseException(ErrorCode.EMAIL_VERIFICATION_CODE_EXPIRED);
        }

        if (!verificationCode.getCode().equals(code)) {
            log.warn("비밀번호 재설정 코드 불일치. email={}", email);
            throw new BaseException(ErrorCode.EMAIL_VERIFICATION_CODE_INVALID);
        }

        verificationCode.markVerified(LocalDateTime.now());
        log.info("비밀번호 재설정 코드 검증 완료. email={}", email);
    }

    @Transactional
    public void resetPassword(String email, String code, String newPassword) {
        log.info("비밀번호 재설정 요청 수신. email={}, code={}", email, code);
        EmailVerificationCode verificationCode = getLatestCode(email);

        if (verificationCode.isExpired(LocalDateTime.now())) {
            log.warn("비밀번호 재설정 코드 만료. email={}", email);
            throw new BaseException(ErrorCode.EMAIL_VERIFICATION_CODE_EXPIRED);
        }

        if (!verificationCode.getCode().equals(code)) {
            log.warn("비밀번호 재설정 코드 불일치. email={}", email);
            throw new BaseException(ErrorCode.EMAIL_VERIFICATION_CODE_INVALID);
        }

        if (!verificationCode.isVerified()) {
            log.warn("비밀번호 재설정 코드 미검증 상태. email={}", email);
            throw new BaseException(ErrorCode.EMAIL_VERIFICATION_NOT_CONFIRMED);
        }

        if (verificationCode.isUsed()) {
            log.warn("비밀번호 재설정 코드 이미 사용됨. email={}", email);
            throw new BaseException(ErrorCode.EMAIL_VERIFICATION_ALREADY_USED);
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        user.updatePassword(passwordEncoder.encode(newPassword));
        verificationCode.markUsed(LocalDateTime.now());
        log.info("비밀번호 재설정 완료. email={}, userId={}", email, user.getId());
    }

    private EmailVerificationCode getLatestCode(String email) {
        return verificationCodeRepository.findTopByEmailOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new BaseException(ErrorCode.EMAIL_VERIFICATION_CODE_INVALID));
    }

    private void validateEmailFormat(String email) {
        if (email == null || !email.matches(EMAIL_REGEX)) {
            throw new BaseException(ErrorCode.INVALID_EMAIL_FORMAT);
        }
    }

    private String generateCode() {
        StringBuilder code = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            code.append(RANDOM.nextInt(10));
        }
        return code.toString();
    }

}
