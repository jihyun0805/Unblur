package com.ssafy.unblur.common.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.unblur.common.security.auth.CustomUserDetails;
import com.ssafy.unblur.domain.auth.model.IdempotencyKey;
import com.ssafy.unblur.domain.auth.repository.IdempotencyKeyRepository;
import com.ssafy.unblur.domain.auth.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class IdempotencyFilter extends OncePerRequestFilter {

    /**
     * 멱등성이 필요한 HTTP 메서드 집합
     */
    private static final Set<String> IDEMPOTENT_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");

    /**
     * 캐시된 응답을 나타내는 헤더 이름
     */
    private static final String CACHE_HEADER = "Idempotency-Cache";

    /**
     * 멱등성 키 헤더 이름
     */
    private static final String headerName = "Idempotency-Key";

    /**
     * 멱등성 키의 TTL(만료 시간)
     */
    private static final Duration ttl = Duration.ofHours(24);

    /**
     * 멱등성 키 리포지토리
     */
    private final IdempotencyKeyRepository idempotencyKeyRepository;

    /**
     * 사용자 리포지토리
     */
    private final UserRepository userRepository;

    /**
     * JSON 객체 매퍼
     */
    private final ObjectMapper objectMapper;

    /**
     * 시스템 시계
     */
    private final Clock clock;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // 멱등성이 필요한 HTTP 메서드가 아닌 경우 필터링하지 않음
        if (!IDEMPOTENT_METHODS.contains(request.getMethod())) {
            return true;
        }

        // 헤더가 없는 경우 필터링하지 않음
        String idempotencyKey = request.getHeader(headerName);
        return idempotencyKey == null || idempotencyKey.isBlank();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // 내부 API는 멱등성 처리하지 않음
        String requestPath = request.getRequestURI();
        if (requestPath != null && requestPath.startsWith("/api/internal/")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 인증 정보 확인
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 멱등성 키 처리
        String traceId = request.getHeader(headerName).trim();
        UUID userId = userDetails.getUserId();

        // 기존 멱등성 키 조회
        IdempotencyKey existing = idempotencyKeyRepository.findByTraceId(traceId).orElse(null);

        if (existing != null) { // 기존 키가 있는 경우
            if (existing.getExpiresAt().isBefore(LocalDateTime.now(clock))) { // 만료된 경우
                idempotencyKeyRepository.delete(existing);

            } else { // 유효한 경우
                if (!existing.getUser().getId().equals(userId) || !existing.getRequestPath().equals(requestPath)) { // 사용자 또는 경로 불일치
                    response.setStatus(HttpServletResponse.SC_CONFLICT);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    objectMapper.writeValue(response.getWriter(), Map.of("message", "Idempotency key already used."));
                    return;
                }

                // 캐시된 응답 반환
                writeCachedResponse(response, existing);
                return;
            }
        }

        // 새 요청 처리
        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);

        try {
            filterChain.doFilter(wrappedRequest, wrappedResponse);

        } finally {
            storeResponse(traceId, requestPath, userId, wrappedResponse);
            wrappedResponse.copyBodyToResponse(); // 응답 본문 복사
        }
    }

    /**
     * 캐시된 응답을 클라이언트에 작성하는 메서드
     *
     * @param response HTTP 응답 객체
     * @param key      멱등성 키 객체
     * @throws IOException 응답 작성 중 발생할 수 있는 예외
     */
    private void writeCachedResponse(HttpServletResponse response, IdempotencyKey key) throws IOException {
        // 상태 코드 및 헤더 설정
        response.setStatus(key.getStatusCode());
        response.setHeader(CACHE_HEADER, "HIT");
        if (key.getResponseBody() == null) {
            return;
        }

        // 응답 본문 작성
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), key.getResponseBody());
    }

    private void storeResponse(String traceId, String requestPath, UUID userId, ContentCachingResponseWrapper response) {
        // 5xx 오류 및 SSE 응답은 저장하지 않음
        int status = response.getStatus();
        if (status >= 500) {
            return;
        }

        // SSE 응답은 저장하지 않음
        String contentType = response.getContentType();
        if (contentType != null && contentType.contains(MediaType.TEXT_EVENT_STREAM_VALUE)) {
            return;
        }

        // 응답 본문 파싱
        Map<String, Object> responseBody = null;
        byte[] bodyBytes = response.getContentAsByteArray();
        if (bodyBytes.length > 0) {
            String body = new String(bodyBytes, StandardCharsets.UTF_8); // 응답 본문을 UTF-8 문자열로 변환

            if (!body.isBlank()) {
                responseBody = parseBody(body);
            }
        }

        // 멱등성 키 객체 생성
        IdempotencyKey key = IdempotencyKey.builder()
                .user(userRepository.getReferenceById(userId))
                .traceId(traceId)
                .requestPath(requestPath)
                .statusCode(status)
                .responseBody(responseBody)
                .expiresAt(LocalDateTime.now(clock).plus(ttl))
                .build();

        // 멱등성 키 저장
        try {
            idempotencyKeyRepository.save(key);

        } catch (DataIntegrityViolationException e) {
            log.debug("멱등성 키 중복으로 저장 실패: {}", traceId);
        }
    }

    /**
     * 응답 본문을 파싱하는 메서드
     *
     * @param body 응답 본문 문자열
     * @return 파싱된 응답 본문 또는 원시 문자열을 포함하는 맵
     */
    private Map<String, Object> parseBody(String body) {
        try {
            return objectMapper.readValue(body, new TypeReference<>() {
            });

        } catch (Exception e) {
            return Map.of("raw", body);
        }
    }
}
