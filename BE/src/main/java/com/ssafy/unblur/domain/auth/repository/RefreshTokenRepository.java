package com.ssafy.unblur.domain.auth.repository;

import com.ssafy.unblur.domain.auth.model.RefreshToken;
import com.ssafy.unblur.domain.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository  extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByJti(String Jti);
    Optional<RefreshToken> findByUser(User user);
    void deleteByUser(User user);
}
