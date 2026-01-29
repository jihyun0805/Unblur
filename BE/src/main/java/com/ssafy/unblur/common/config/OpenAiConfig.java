package com.ssafy.unblur.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.BufferingClientHttpRequestFactory;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class OpenAiConfig {

    @Bean
    public RestClient openAiRestClient(@Value("${openai.api-key}") String apiKey) {
        ClientHttpRequestFactory requestFactory = new BufferingClientHttpRequestFactory(
                new HttpComponentsClientHttpRequestFactory()
        );
        return RestClient.builder()
                .baseUrl("https://gms.ssafy.io/gmsapi/api.openai.com")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .requestFactory(requestFactory)
                .build();
    }
}
