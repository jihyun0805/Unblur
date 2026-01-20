package com.ssafy.unblur;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.Collections;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    @Bean // 비밀번호 암호화
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        return request -> {
            CorsConfiguration configuration = new CorsConfiguration(); // 설정 객체를 생성
            configuration.setAllowedOrigins(Collections.singletonList("http://localhost:3000")); // 프론트엔드 주소(3000번 포트)의 접근을 허용
            configuration.setAllowedMethods(Collections.singletonList("*")); // 모든 HTTP 메서드 호출을 허용
            configuration.setAllowCredentials(true); // 쿠키나 인증 정보를 포함한 요청을 허용
            configuration.setAllowedHeaders(Collections.singletonList("*")); // 클라이언트가 보낸 모든 헤더 정보를 받아들임
            configuration.setExposedHeaders(Collections.singletonList("Authorization")); // 클라이언트가 JWT 토큰이 담긴 'Authorization' 헤더를 읽을 수 있게 노출
            configuration.setMaxAge(3600L); // 이 설정값을 브라우저가 1시간(3600초) 동안 기억하게 하여 중복 체크를 줄임
            return configuration; // 최종 설정을 반환합니다.
        };
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource())) // CORS
                .csrf(AbstractHttpConfigurer::disable) // CSRF 보안 비활성화
                .formLogin(AbstractHttpConfigurer::disable) // 스프링 시큐리티가 기본으로 제공하는 HTML 로그인 화면을 사용하지 않음
                .httpBasic(AbstractHttpConfigurer::disable) // 브라우저 팝업창 형태의 기본 인증 방식을 사용하지 않고, 요청 헤더의 토큰을 사용할 것이므로 비활성화

                .authorizeHttpRequests(auth -> auth
                        // Swagger 관련 경로
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                        // 로그인 및 회원가입 경로
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/**").permitAll()
                        .requestMatchers("/admin").hasAuthority("ADMIN")
                        // 일단은 모든 경로에 대하여 허용
                        .anyRequest().permitAll()
                )

                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)); // 서버가 사용자의 세션을 메모리에 저장하지 않도록 'STATELESS(무상태)' 모드로 설정

        return http.build();
    }
}
