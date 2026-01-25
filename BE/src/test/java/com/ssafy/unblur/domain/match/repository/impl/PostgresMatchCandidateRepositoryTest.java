package com.ssafy.unblur.domain.match.repository.impl;

import com.ssafy.unblur.domain.match.repository.MatchCandidateRepository.MatchCandidate;
import com.ssafy.unblur.common.util.VectorUtils;
import com.ssafy.unblur.domain.user.model.Gender;
import com.ssafy.unblur.domain.user.model.Region;
import com.ssafy.unblur.domain.user.model.User;
import com.ssafy.unblur.domain.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.data.Offset.offset;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE) // H2 대신 실제 Postgres 사용 (pgvector 지원 필요)
class PostgresMatchCandidateRepositoryTest {

    @Autowired
    private PostgresMatchCandidateRepository repository;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("findQuickCandidates: 후보가 주어졌을 때 유사도 높은 순으로 반환한다")
    void findQuickCandidates_returnsSortedBySimilarity() {
        // given: 유사도가 다른 후보가 주어졌을 때
        User requester = userRepository.save(createUser("req@test.com", "req", unitVectorX(), Gender.MALE, Region.SEOUL, LocalDate.of(1995, 1, 1)));
        User candidateA = userRepository.save(createUser("a@test.com", "candA", unitVectorX(), Gender.MALE, Region.SEOUL, LocalDate.of(1995, 1, 1)));
        User candidateB = userRepository.save(createUser("b@test.com", "candB", unitVectorY(), Gender.MALE, Region.SEOUL, LocalDate.of(1995, 1, 1)));

        String queryVector = VectorUtils.toVectorLiteral(requester.getInterestsVector());
        List<UUID> candidateIds = List.of(candidateA.getId(), candidateB.getId());

        // when: 후보를 조회하면
        List<MatchCandidate> results = repository.findQuickCandidates(
                requester.getId(),
                queryVector,
                candidateIds,
                null,
                null,
                null,
                null,
                10
        );

        // then: 유사도 높은 순으로 반환한다
        assertThat(results)
                .extracting(MatchCandidate::id)
                .containsExactly(candidateA.getId(), candidateB.getId());
    }

    @Test
    @DisplayName("findQuickCandidates: 유사도 값이 다를 때 점수와 정렬이 기대와 일치한다")
    void findQuickCandidates_returnsSimilarityScores() {
        // given: 서로 다른 방향의 벡터 후보가 주어졌을 때
        User requester = userRepository.save(createUser("req3@test.com", "req3", unitVectorX(), Gender.MALE, Region.SEOUL, LocalDate.of(1995, 1, 1)));
        User same = userRepository.save(createUser("same@test.com", "same", unitVectorX(), Gender.MALE, Region.SEOUL, LocalDate.of(1995, 1, 1)));
        User diagonal = userRepository.save(createUser("diag@test.com", "diag", unitVectorDiagonal(), Gender.MALE, Region.SEOUL, LocalDate.of(1995, 1, 1)));
        User opposite = userRepository.save(createUser("opp@test.com", "opp", unitVectorNegX(), Gender.MALE, Region.SEOUL, LocalDate.of(1995, 1, 1)));

        String queryVector = VectorUtils.toVectorLiteral(requester.getInterestsVector());
        List<UUID> candidateIds = List.of(same.getId(), diagonal.getId(), opposite.getId());

        // when: 후보를 조회하면
        List<MatchCandidate> results = repository.findQuickCandidates(
                requester.getId(),
                queryVector,
                candidateIds,
                null,
                null,
                null,
                null,
                10
        );

        // then: 유사도 높은 순으로 정렬되며 점수도 기대값에 가깝다
        assertThat(results).hasSize(3);
        assertThat(results.get(0).id()).isEqualTo(same.getId());
        assertThat(results.get(1).id()).isEqualTo(diagonal.getId());
        assertThat(results.get(2).id()).isEqualTo(opposite.getId());

        assertThat(results.get(0).similarity()).isCloseTo(1.0, offset(1e-6));
        assertThat(results.get(1).similarity()).isCloseTo(1.0 / Math.sqrt(2), offset(1e-6));
        assertThat(results.get(2).similarity()).isCloseTo(-1.0, offset(1e-6));
    }

    @Test
    @DisplayName("findQuickCandidates: 필터 조건이 주어졌을 때 조건에 맞는 후보만 반환한다")
    void findQuickCandidates_returnsOnlyFilteredCandidates() {
        // given: 필터 조건이 주어졌을 때
        User requester = userRepository.save(createUser("req2@test.com", "req2", unitVectorX(), Gender.MALE, Region.SEOUL, LocalDate.of(1995, 1, 1)));
        User matched = userRepository.save(createUser("m@test.com", "matched", unitVectorX(), Gender.MALE, Region.SEOUL, LocalDate.of(1995, 1, 1)));
        User wrongGender = userRepository.save(createUser("f@test.com", "female", unitVectorX(), Gender.FEMALE, Region.SEOUL, LocalDate.of(1995, 1, 1)));
        User wrongRegion = userRepository.save(createUser("r@test.com", "region", unitVectorX(), Gender.MALE, Region.BUSAN, LocalDate.of(1995, 1, 1)));
        User wrongAge = userRepository.save(createUser("a@test.com", "age", unitVectorX(), Gender.MALE, Region.SEOUL, LocalDate.of(2005, 1, 1)));

        String queryVector = VectorUtils.toVectorLiteral(requester.getInterestsVector());
        List<UUID> candidateIds = List.of(matched.getId(), wrongGender.getId(), wrongRegion.getId(), wrongAge.getId());

        // when: 필터를 적용해 후보를 조회하면
        List<MatchCandidate> results = repository.findQuickCandidates(
                requester.getId(),
                queryVector,
                candidateIds,
                Gender.MALE.name(),
                Region.SEOUL.name(),
                LocalDate.of(2000, 1, 1),
                LocalDate.of(1990, 1, 1),
                10
        );

        // then: 조건에 맞는 후보만 반환한다
        assertThat(results)
                .extracting(MatchCandidate::id)
                .containsExactly(matched.getId());
    }

    /**
     * 테스트용 사용자 엔티티를 생성하는 메서드
     *
     * @param email     이메일
     * @param nickname  닉네임
     * @param vector    관심사 벡터
     * @param gender    성별
     * @param region    지역
     * @param birthDate 생년월일
     * @return 사용자 엔티티
     */
    private User createUser(String email, String nickname, float[] vector, Gender gender, Region region, LocalDate birthDate) {
        return User.builder()
                .email(email)
                .password("password")
                .nickname(nickname)
                .birthDate(birthDate)
                .gender(gender)
                .region(region)
                .online(true)
                .active(true)
                .interestsVector(vector)
                .build();
    }

    /**
     * 코사인 유사도 기준으로 X축 단위 벡터를 만드는 메서드
     *
     * @return x축 단위 벡터
     */
    private float[] unitVectorX() {
        float[] vector = new float[384];
        vector[0] = 1.0f;
        return vector;
    }

    /**
     * 코사인 유사도 기준으로 Y축 단위 벡터를 만드는 메서드
     *
     * @return y축 단위 벡터
     */
    private float[] unitVectorY() {
        float[] vector = new float[384];
        vector[1] = 1.0f;
        return vector;
    }

    /**
     * 코사인 유사도 기준으로 대각선 단위 벡터를 만드는 메서드
     */
    private float[] unitVectorDiagonal() {
        float v = (float) (1.0 / Math.sqrt(2));
        float[] vector = new float[384];
        vector[0] = v;
        vector[1] = v;
        return vector;
    }

    /**
     * 코사인 유사도 기준으로 음의 x축 단위 벡터를 만드는 메서드
     */
    private float[] unitVectorNegX() {
        float[] vector = new float[384];
        vector[0] = -1.0f;
        return vector;
    }

}
