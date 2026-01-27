package com.ssafy.unblur.domain.match.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.unblur.common.config.SecurityConfig;
import com.ssafy.unblur.common.security.auth.CustomUserDetails;
import com.ssafy.unblur.common.security.jwt.JWTUtil;
import com.ssafy.unblur.domain.match.controller.impl.MatchControllerImpl;
import com.ssafy.unblur.domain.match.dto.FastMatchingRequest;
import com.ssafy.unblur.domain.match.dto.MatchingQueueResponse;
import com.ssafy.unblur.domain.match.service.MatchService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = MatchControllerImpl.class)
@Import(SecurityConfig.class)
@AutoConfigureMockMvc
@DisplayName("MatchController - 빠른 매칭")
class MatchControllerQuickMatchTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private MatchService matchService;

    @MockitoBean
    private JWTUtil jwtUtil;

    @Nested
    @DisplayName("POST /api/v1/match/quick")
    class StartQuickMatch {

        @Test
        @DisplayName("인증된 사용자가 있으면 요청할 때 200 응답을 받는다")
        void successWhenAuthenticated() throws Exception {
            // given: 인증된 사용자와 응답이 준비되어 있으면
            UUID userId = UUID.randomUUID();
            CustomUserDetails userDetails = new CustomUserDetails("user@example.com", userId);

            FastMatchingRequest request = new FastMatchingRequest();
            request.setFilters(Map.of("ageMin", 24));

            MatchingQueueResponse response = MatchingQueueResponse.builder()
                    .requestId("queue-id")
                    .status("waiting")
                    .isQueued(true)
                    .position(1)
                    .estimatedWaitSeconds(60)
                    .queueType("quick")
                    .waitingCount(1)
                    .queuedAt(LocalDateTime.parse("2026-01-26T14:30:00"))
                    .build();

            when(matchService.startQuickMatch(eq(userId), org.mockito.ArgumentMatchers.any(FastMatchingRequest.class)))
                    .thenReturn(response);

            // when: 빠른 매칭을 요청할 때
            mockMvc.perform(post("/api/v1/match/quick")
                            .with(SecurityMockMvcRequestPostProcessors.user(userDetails))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsBytes(request)))
                    // then: 200 응답을 받는다
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.isSuccess").value(true))
                    .andExpect(jsonPath("$.statusCode").value(200))
                    .andExpect(jsonPath("$.message").value("OK"))
                    .andExpect(jsonPath("$.data.requestId").value("queue-id"));

            ArgumentCaptor<FastMatchingRequest> captor = ArgumentCaptor.forClass(FastMatchingRequest.class);
            verify(matchService).startQuickMatch(eq(userId), captor.capture());
            assertThat(captor.getValue().getFilters()).isEqualTo(request.getFilters());
        }

        @Test
        @DisplayName("인증 정보가 없으면 요청할 때 403 응답을 받는다")
        void unauthorizedWhenNoAuthentication() throws Exception {
            // given: 인증 정보가 없으면
            FastMatchingRequest request = new FastMatchingRequest();
            request.setFilters(Map.of("ageMin", 24));

            // when: 빠른 매칭을 요청할 때
            mockMvc.perform(post("/api/v1/match/quick")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsBytes(request)))
                    // then: 403 응답을 받는다
                    .andExpect(status().isForbidden());
        }
    }
}
