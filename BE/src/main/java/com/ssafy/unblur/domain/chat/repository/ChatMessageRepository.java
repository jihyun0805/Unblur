package com.ssafy.unblur.domain.chat.repository;

import com.ssafy.unblur.domain.chat.model.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    @EntityGraph(attributePaths = {"user"})
    Page<ChatMessage> findByConferenceId(UUID conferenceId, Pageable pageable);

    @Query("""
        select count(m)
        from ChatMessage m
        where m.conference.id = :conferenceId
          and (m.user is null or m.user.id <> :userId)
    """)
    long countOtherMessages(
            @Param("conferenceId") UUID conferenceId,
            @Param("userId") UUID userId
    );

    @Query("""
        select count(m)
        from ChatMessage m
        where m.conference.id = :conferenceId
          and (m.user is null or m.user.id <> :userId)
          and m.createdAt > :lastReadAt
    """)
    long countOtherMessagesAfter(
            @Param("conferenceId") UUID conferenceId,
            @Param("userId") UUID userId,
            @Param("lastReadAt") LocalDateTime lastReadAt
    );
}
