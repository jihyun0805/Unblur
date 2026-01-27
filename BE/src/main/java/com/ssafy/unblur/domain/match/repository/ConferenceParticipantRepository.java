package com.ssafy.unblur.domain.match.repository;

import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.match.model.Conference;
import com.ssafy.unblur.domain.match.model.ConferenceParticipant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConferenceParticipantRepository extends JpaRepository<ConferenceParticipant, UUID> {

    @EntityGraph(attributePaths = {"conference"})
    Page<ConferenceParticipant> findByUserOrderByConferenceCreatedAtDesc(User user, Pageable pageable);

    @EntityGraph(attributePaths = {"conference", "user"})
    List<ConferenceParticipant> findByConferenceIdIn(List<UUID> conferenceIds);

    long countByUser(User user);

    @Query("select cp.conference from ConferenceParticipant cp where cp.user = :user")
    List<Conference> findConferencesByUser(@Param("user") User user);

    Optional<ConferenceParticipant> findByConferenceIdAndUser(UUID conferenceId, User user);

    List<ConferenceParticipant> findByConferenceId(UUID conferenceId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update ConferenceParticipant cp
            set cp.lastReadAt = :readAt
            where cp.conference.id = :conferenceId
              and cp.user = :user
              and (cp.lastReadAt is null or cp.lastReadAt < :readAt)
            """)
    int updateLastReadAt(
            @Param("conferenceId") UUID conferenceId,
            @Param("user") User user,
            @Param("readAt") LocalDateTime readAt
    );
}

