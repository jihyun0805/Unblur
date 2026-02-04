package com.ssafy.unblur.common.security.jwt;

import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.common.security.auth.CustomUserDetails;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@RequiredArgsConstructor
public class JWTFilter extends OncePerRequestFilter {

    private final JWTUtil jwtUtil;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        String requestPath = request.getRequestURI();
        if (requestPath != null && requestPath.startsWith("/api/internal/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String authorizationHeader = request.getHeader("Authorization");

        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authorizationHeader.substring(7);

        try {
            if (jwtUtil.isTokenExpired(token)) {
                MDC.put("status", String.valueOf(HttpServletResponse.SC_UNAUTHORIZED));
                MDC.put("errorCode", ErrorCode.EXPIRED_TOKEN.getCode());
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("AccessToken Expired");
                return;
            }

            String email = jwtUtil.getUsername(token);
            String userId = jwtUtil.getUserId(token);

            if (userId == null) {
                MDC.put("status", String.valueOf(HttpServletResponse.SC_UNAUTHORIZED));
                MDC.put("errorCode", ErrorCode.INVALID_TOKEN.getCode());
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Invalid Token");
                return;
            }

            CustomUserDetails customUserDetails = new CustomUserDetails(email, java.util.UUID.fromString(userId));
            Authentication authToken = new UsernamePasswordAuthenticationToken(customUserDetails, null, customUserDetails.getAuthorities());

            SecurityContextHolder.getContext().setAuthentication(authToken);

        } catch (Exception e) {
            MDC.put("status", String.valueOf(HttpServletResponse.SC_UNAUTHORIZED));
            MDC.put("errorCode", ErrorCode.INVALID_TOKEN.getCode());
            log.error("JWT 검증 실패: {}", e.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Invalid Token");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
