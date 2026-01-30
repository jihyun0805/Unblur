package com.ssafy.unblur.domain.game.repository;

import com.ssafy.unblur.domain.game.model.QuestionDictionary;
import com.ssafy.unblur.domain.game.model.RoundGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuestionDictionaryRepository extends JpaRepository<QuestionDictionary, UUID> {

    List<QuestionDictionary> findByRoundGroup(RoundGroup roundGroup);
}
