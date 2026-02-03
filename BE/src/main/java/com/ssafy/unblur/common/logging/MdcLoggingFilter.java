package com.ssafy.unblur.common.logging;

import com.ssafy.unblur.common.security.auth.CustomUserDetails;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Slf4j
@Component
public class MdcLoggingFilter extends OncePerRequestFilter {

    /**
     * 요청 ID 헤더
     */
    private static final String HEADER_REQUEST_ID = "X-Request-Id";

    /**
     * 멱등성 키 헤더
     */
    private static final String HEADER_IDEMPOTENCY = "Idempotency-Key";

    /**
     * MDC 요청 ID 키
     */
    private static final String MDC_REQUEST_ID = "requestId";

    /**
     * MDC 사용자 ID 키
     */
    private static final String MDC_USER_ID = "userId";

    /**
     * MDC HTTP 메서드 키
     */
    private static final String MDC_METHOD = "method";

    /**
     * MDC 경로 키
     */
    private static final String MDC_PATH = "path";

    /**
     * MDC 클라이언트 IP 키
     */
    private static final String MDC_IP = "ip";

    private static final String MDC_STATUS = "status";
    private static final String MDC_ERROR_CODE = "errorCode";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // 요청 ID 확인 및 생성
        String requestId = resolveRequestId(request);

        // MDC에 정보 설정
        MDC.put(MDC_REQUEST_ID, requestId);
        MDC.put(MDC_METHOD, request.getMethod());
        MDC.put(MDC_PATH, request.getRequestURI());
        MDC.put(MDC_IP, request.getRemoteAddr());
        MDC.put(MDC_STATUS, "-");
        MDC.put(MDC_ERROR_CODE, "-");

        // 사용자 인증 정보에서 사용자 ID 설정
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            MDC.put(MDC_USER_ID, userDetails.getUserId().toString());
        }

        // 응답 헤더에 요청 ID 설정
        response.setHeader(HEADER_REQUEST_ID, requestId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.clear();
        }
    }

    /**
     * 요청에서 요청 ID를 확인하거나 새로 생성
     */
    private String resolveRequestId(HttpServletRequest request) {
        String requestId = request.getHeader(HEADER_REQUEST_ID);

        if (requestId == null || requestId.isBlank()) {
            requestId = request.getHeader(HEADER_IDEMPOTENCY);
        }

        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString();
        }

        return requestId.trim();
    }
}