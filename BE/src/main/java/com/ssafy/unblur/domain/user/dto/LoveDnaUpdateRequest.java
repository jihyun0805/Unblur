package com.ssafy.unblur.domain.user.dto;

import com.ssafy.unblur.domain.auth.model.LoveDna;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class LoveDnaUpdateRequest {

    @Schema(description = "연애 성향 유형", example = "EFPD")
    private LoveDna loveDna;
}
