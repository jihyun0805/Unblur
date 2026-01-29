package com.ssafy.unblur.domain.survey.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmbeddingService {

    private final RestClient openAiRestClient;

    @Value("${openai.embedding.model}")
    private String model;

    @Value("${openai.embedding.dimensions}")
    private int dimensions;

    @SuppressWarnings("unchecked")
    public float[] embed(String text) {
        try {
            Map<String, Object> request = Map.of(
                    "model", model,
                    "input", text,
                    "dimensions", dimensions
            );

            Map<String, Object> response = openAiRestClient.post()
                    .uri("/v1/embeddings")
                    .body(request)
                    .retrieve()
                    .body(Map.class);

            if (response == null) {
                log.warn("OpenAI embedding API 응답이 null입니다.");
                return null;
            }

            List<Map<String, Object>> data = (List<Map<String, Object>>) response.get("data");
            List<Number> embedding = (List<Number>) data.get(0).get("embedding");

            float[] vector = new float[embedding.size()];
            for (int i = 0; i < embedding.size(); i++) {
                vector[i] = embedding.get(i).floatValue();
            }
            return vector;
        } catch (Exception e) {
            log.error("OpenAI embedding API 호출 실패: {}", e.getMessage(), e);
            return null;
        }
    }
}
