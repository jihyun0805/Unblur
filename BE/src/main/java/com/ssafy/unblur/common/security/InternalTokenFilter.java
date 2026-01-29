package com.ssafy.unblur.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class InternalTokenFilter extends OncePerRequestFilter {

    private final String internalToken;

    public InternalTokenFilter(@Value("${internal.api.token}") String internalToken) {
        this.internalToken = internalToken;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String requestPath = request.getRequestURI();
        if (requestPath.startsWith("/api/internal/")) {
            String token = request.getHeader("X-Internal-Token");
            if (token == null || internalToken == null || internalToken.isBlank() || !internalToken.equals(token)) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Invalid internal token");
                return;
            }
        }
        filterChain.doFilter(request, response);
    }
}
