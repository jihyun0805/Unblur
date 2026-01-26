package com.ssafy.unblur.common.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@OpenAPIDefinition(
        security = { @SecurityRequirement(name = "bearerAuth") }
)
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        in = SecuritySchemeIn.HEADER
)
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        Info info = new Info()
                .title("Unblur")
                .description("<h3>2030 세대를 위한 가치관/관심사 기반 블라인드 소개팅 서비스</h3>" +
                        "<ul>" +
                        "<li>영상/채팅 실시간 매칭</li>" +
                        "<li>PGVector 기반 관심사 추천</li>" +
                        "<li>단계별 블라인드 해제 기능</li>" +
                        "</ul>")
                .version("v1.0.0")
                .contact(new Contact()
                        .name("Unblur")
                        .url(""));

        return new OpenAPI().info(info);
    }
}