package com.ssafy.unblur.domain.auth.service;

public interface EmailService {

    void sendPasswordResetCode(String email, String code);
}
