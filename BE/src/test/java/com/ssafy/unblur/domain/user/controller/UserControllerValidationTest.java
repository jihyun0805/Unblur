package com.ssafy.unblur.domain.user.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
class UserControllerValidationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("프로필 수정 닉네임 공백/개행 입력 시 400 반환")
    void updateProfile_invalidNickname_returnsBadRequest() throws Exception {
        String body = """
                {
                  \"nickname\": \" \n\"
                }
                """;

        mockMvc.perform(patch("/api/v1/users/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andDo(result -> System.out.println("[UserControllerValidationTest] response=" + result.getResponse().getContentAsString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.isSuccess").value(false))
                .andExpect(jsonPath("$.statusCode").value(400))
                .andExpect(jsonPath("$.errorCode").value("COMMON-002"));
    }
}