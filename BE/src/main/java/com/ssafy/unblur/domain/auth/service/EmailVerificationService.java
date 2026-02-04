package com.ssafy.unblur.domain.auth.service;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.domain.auth.model.EmailVerificationCode;
import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.auth.repository.EmailVerificationCodeRepository;
import com.ssafy.unblur.domain.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

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
        validateEmailFormat(email);
        if (userRepository.findByEmail(email).isEmpty()) {
            return;
        }

        String code = generateCode();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(expireMinutes);

        verificationCodeRepository.deleteByEmail(email);
        verificationCodeRepository.save(
                EmailVerificationCode.create(email, code, expiresAt)
        );

        emailService.sendPasswordResetCode(email, code);
    }

    @Transactional
    public void confirmPasswordResetCode(String email, String code) {
        EmailVerificationCode verificationCode = getLatestCode(email);

        if (verificationCode.isExpired(LocalDateTime.now())) {
            throw new BaseException(ErrorCode.EMAIL_VERIFICATION_CODE_EXPIRED);
        }

        if (!verificationCode.getCode().equals(code)) {
            throw new BaseException(ErrorCode.EMAIL_VERIFICATION_CODE_INVALID);
        }

        verificationCode.markVerified(LocalDateTime.now());
    }

    @Transactional
    public void resetPassword(String email, String code, String newPassword) {
        EmailVerificationCode verificationCode = getLatestCode(email);

        if (verificationCode.isExpired(LocalDateTime.now())) {
            throw new BaseException(ErrorCode.EMAIL_VERIFICATION_CODE_EXPIRED);
        }

        if (!verificationCode.getCode().equals(code)) {
            throw new BaseException(ErrorCode.EMAIL_VERIFICATION_CODE_INVALID);
        }

        if (!verificationCode.isVerified()) {
            throw new BaseException(ErrorCode.EMAIL_VERIFICATION_NOT_CONFIRMED);
        }

        if (verificationCode.isUsed()) {
            throw new BaseException(ErrorCode.EMAIL_VERIFICATION_ALREADY_USED);
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        user.updatePassword(passwordEncoder.encode(newPassword));
        verificationCode.markUsed(LocalDateTime.now());
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
