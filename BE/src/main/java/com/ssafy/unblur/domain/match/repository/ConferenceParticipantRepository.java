package com.ssafy.unblur.domain.match.repository;

import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.match.model.Conference;
import com.ssafy.unblur.domain.match.model.ConferenceParticipant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ConferenceParticipantRepository extends JpaRepository<ConferenceParticipant, UUID> {

    @EntityGraph(attributePaths = {"conference"})
    Page<ConferenceParticipant> findByUserOrderByConferenceCreatedAtDesc(User user, Pageable pageable);

    @EntityGraph(attributePaths = {"conference", "user"})
    List<ConferenceParticipant> findByConferenceIdIn(List<UUID> conferenceIds);

    long countByUser(User user);

    @Query("select cp.conference from ConferenceParticipant cp where cp.user = :user")
    List<Conference> findConferencesByUser(@Param("user") User user);
}

