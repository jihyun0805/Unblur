package com.ssafy.unblur.common.config;

import com.ssafy.unblur.common.security.jwt.JWTFilter;
import com.ssafy.unblur.common.security.jwt.JWTUtil;
import com.ssafy.unblur.domain.user.repository.UserRepository;
import com.ssafy.unblur.domain.user.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JWTUtil jwtUtil;

    @Bean // 비밀번호 암호화
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .cors(Customizer.withDefaults()) // CORS
                .csrf(AbstractHttpConfigurer::disable) // CSRF 보안 비활성화
                .formLogin(AbstractHttpConfigurer::disable) // 스프링 시큐리티가 기본으로 제공하는 HTML 로그인 화면을 사용하지 않음
                .httpBasic(AbstractHttpConfigurer::disable) // 브라우저 팝업창 형태의 기본 인증 방식을 사용하지 않고, 요청 헤더의 토큰을 사용할 것이므로 비활성화
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // 서버가 사용자의 세션을 메모리에 저장하지 않도록 'STATELESS(무상태)' 모드로 설정
                .authorizeHttpRequests(auth -> auth
                        // Swagger 관련 경로
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                        // 로그인 및 회원가입 경로
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        // 일단은 모든 경로에 대하여 허용
                        .anyRequest().permitAll()
                )
                .addFilterBefore(new JWTFilter(jwtUtil), UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}
