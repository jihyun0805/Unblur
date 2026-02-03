package com.ssafy.unblur.domain.auth.repository;

import com.ssafy.unblur.domain.auth.model.RefreshToken;
import com.ssafy.unblur.domain.auth.model.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository  extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByUser(User user);
    void deleteByUser(User user);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM RefreshToken r WHERE r.user = :user")
    Optional<RefreshToken> findByUserForUpdate(@Param("user") User user);
}
