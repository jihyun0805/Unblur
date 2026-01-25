package com.ssafy.unblur.common.security.auth;

import com.ssafy.unblur.domain.auth.model.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

public class CustomUserDetails implements UserDetails {

    private final String email;
    private final String password;
    private final boolean active;

    /**
     * User 엔티티로 생성 (CustomUserDetailsService에서 로그인 시 사용)
     */
    public CustomUserDetails(User user) {
        this.email = user.getEmail();
        this.password = user.getPassword();
        this.active = user.isActive();
    }

    /**
     * email만으로 생성 (JWTFilter에서 토큰 검증 시 사용)
     * 이미 토큰이 발급된 상태이므로 active는 true로 설정
     */
    public CustomUserDetails(String email) {
        this.email = email;
        this.password = null;
        this.active = true;
    }

    /**
     * 사용자의 권한을 반환합니다.
     * User 엔티티에 Role 필드가 없으므로, 기본값인 "ROLE_USER"를 부여합니다.
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public String getPassword() {
        return password;
    }

    /**
     * @return email이 식별자이므로 email을 반환합니다.
     */
    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    /**
     * 계정 활성화 여부를 반환합니다.
     *
     * @return User 엔티티의 active 필드와 연결하여, 탈퇴하거나 차단된 유저의 로그인을 막습니다.
     */
    @Override
    public boolean isEnabled() {
        return active;
    }
}
