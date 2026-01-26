package com.ssafy.unblur.common.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Optional;

@Slf4j
public final class SecurityUtil {

    private SecurityUtil() {
        // 인스턴스화 방지
    }

    /**
     * 현재 Security Context에 저장된 사용자의 이메일을 반환합니다.
     *
     * @return 인증된 사용자의 이메일. 인증 정보가 없으면 Optional.empty() 반환
     */
    public static Optional<String> getCurrentUserEmail() {
        final Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            log.debug("Security Context에 인증 정보가 없습니다.");
            return Optional.empty();
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof UserDetails userDetails) {
            return Optional.of(userDetails.getUsername());
        }

        if (principal instanceof String email && !"anonymousUser".equals(email)) {
            return Optional.of(email);
        }

        return Optional.empty();
    }
}
