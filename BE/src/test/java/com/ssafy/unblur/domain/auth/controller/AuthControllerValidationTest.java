package com.ssafy.unblur.domain.auth.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("local")
@TestPropertySource(properties = {
        "internal.api.token=${INTERNAL_API_TOKEN:test-token}",
        "jwt.secret=${JWT_SECRET:test-secret}",
        "openai.api-key=${GMS_KEY:test-key}",
        "minio.endpoint=${MINIO_ENDPOINT:http://localhost:9000}",
        "minio.access-key=${MINIO_ROOT_USER:minio}",
        "minio.secret-key=${MINIO_ROOT_PASSWORD:minio123}",
        "minio.bucket=${MINIO_BUCKET:unblur-recordings}"
})
class AuthControllerValidationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("회원가입 닉네임 공백/개행 입력 시 400 반환")
    void signup_invalidNickname_returnsBadRequest() throws Exception {
        String body = """
                {
                  \"email\": \"test@unblur.com\",
                  \"password\": \"Unblur123!\",
                  \"nickname\": \" \n\",
                  \"birthDate\": \"2000-01-01\",
                  \"gender\": \"MALE\",
                  \"interestTags\": [\"코딩\"]
                }
                """;

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andDo(result -> System.out.println("[AuthControllerValidationTest] response=" + result.getResponse().getContentAsString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.isSuccess").value(false))
                .andExpect(jsonPath("$.statusCode").value(400))
                .andExpect(jsonPath("$.errorCode").value("COMMON-002"));
    }
}