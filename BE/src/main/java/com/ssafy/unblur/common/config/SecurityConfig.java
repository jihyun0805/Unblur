package com.ssafy.unblur.common.config;

import com.ssafy.unblur.common.security.InternalTokenFilter;
import com.ssafy.unblur.common.security.handler.CustomAccessDeniedHandler;
import com.ssafy.unblur.common.security.handler.CustomAuthenticationEntryPoint;
import com.ssafy.unblur.common.security.jwt.JWTFilter;
import com.ssafy.unblur.common.security.jwt.JWTUtil;
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
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JWTUtil jwtUtil;
    private final CustomAuthenticationEntryPoint authenticationEntryPoint;
    private final CustomAccessDeniedHandler accessDeniedHandler;
    private final InternalTokenFilter internalTokenFilter;

    /** ASYNC 디스패치(SSE 이벤트 전송 등)에서 SecurityContext 복원용 요청 스코프 리포지토리 */
    private final RequestAttributeSecurityContextRepository requestRepo =
            new RequestAttributeSecurityContextRepository();

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
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .securityContext(context -> context
                        .securityContextRepository(requestRepo)
                        .requireExplicitSave(false))
                .exceptionHandling(handler -> handler
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .authorizeHttpRequests(auth -> auth
                        // Actuator (Prometheus scrape용)
                        .requestMatchers(
                                "/actuator/health/**",
                                "/actuator/info/**",
                                "/actuator/prometheus"
                        ).permitAll()
                        // Swagger 관련 경로
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                        // WebSocket/SockJS 핸드셰이크 허용(인증은 STOMP CONNECT에서 처리)
                        .requestMatchers("/ws/**").permitAll()
                        // 로그인 및 회원가입 경로
                        .requestMatchers(
                                "/api/v1/auth/register",
                                "/api/v1/auth/login",
                                "/api/v1/auth/check-email",
                                "/api/v1/auth/check-nickname",
                                "/api/v1/auth/reissue"
                        ).permitAll()
                        .requestMatchers("/api/internal/**").permitAll()
                        // 인증된 사용자만 접근 가능
                        .requestMatchers("/api/v1/auth/logout", "/api/v1/users/withdraw").authenticated()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(internalTokenFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(new JWTFilter(jwtUtil), InternalTokenFilter.class)
                .build();
    }
}
