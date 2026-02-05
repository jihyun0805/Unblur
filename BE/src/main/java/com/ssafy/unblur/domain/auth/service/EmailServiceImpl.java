package com.ssafy.unblur.domain.auth.service;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Override
    public void sendPasswordResetCode(String email, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

            helper.setTo(email);
            helper.setSubject("[UNBLUR] 비밀번호 재설정 인증 코드");

            String body = buildPasswordResetBody(code);
            helper.setText(body, true);
            helper.setFrom(new InternetAddress(fromEmail, "UNBLUR"));

            mailSender.send(message);
        } catch (Exception e) {
            log.error("이메일 발송 실패: email={}, error={}", email, e.getMessage(), e);
            throw new BaseException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    private String buildPasswordResetBody(String code) {
        return """
                <div style='margin:40px;font-family:Arial,sans-serif;'>
                  <h2>비밀번호 재설정 인증 코드</h2>
                  <p>아래 코드를 화면에 입력해주세요.</p>
                  <div style='margin:24px 0;padding:16px;border:1px solid #ddd;border-radius:8px;'>
                    <strong style='font-size:20px;'>%s</strong>
                  </div>
                  <p>인증 코드는 일정 시간 후 만료됩니다.</p>
                </div>
                """.formatted(code);
    }
}
