package com.ssafy.unblur.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TokenReissueResultDto {
    private String accessToken;
    private String refreshToken;
}
