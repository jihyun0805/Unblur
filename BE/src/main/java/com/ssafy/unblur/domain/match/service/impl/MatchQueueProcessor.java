package com.ssafy.unblur.domain.match.service.impl;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.common.util.VectorUtils;
import com.ssafy.unblur.domain.auth.model.User;
import com.ssafy.unblur.domain.auth.repository.UserRepository;
import com.ssafy.unblur.domain.match.config.MatchConfig.MatchPolicy;
import com.ssafy.unblur.domain.match.dto.event.QuickMatchResultEvent;
import com.ssafy.unblur.domain.match.dto.event.QuickMatchStageEvent;
import com.ssafy.unblur.domain.match.model.*;
import com.ssafy.unblur.common.service.event.SseEventType;
import com.ssafy.unblur.common.util.TransactionUtils;
import com.ssafy.unblur.domain.match.repository.ConferenceRepository;
import com.ssafy.unblur.domain.auth.model.Gender;
import com.ssafy.unblur.domain.match.repository.MatchCandidateRepository;
import com.ssafy.unblur.domain.match.repository.MatchCandidateRepository.MatchCandidate;
import com.ssafy.unblur.domain.match.service.MatchEventPublisher;
import com.ssafy.unblur.domain.match.service.MatchQueueService;
import com.ssafy.unblur.domain.survey.service.SurveySimilarityCalculator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;
import java.util.concurrent.locks.ReentrantLock;

/**
 * 매칭 대기열 처리 컴포넌트
 * <p>
 * 단일 큐를 시간 기준으로 훑으며 완화/타임아웃/배치 매칭을 처리하며 동시 충돌을 막기 위해 내부 락으로 보호한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MatchQueueProcessor {

    /**
     * 타임아웃 시 임계치 비활성 값을 나타내는 상수
     */
    private static final double NO_THRESHOLD = -1.0;

    /**
     * 매칭 대기열 저장소
     */
    private final MatchQueueService matchQueueService;

    /**
     * 사용자 조회 레포지토리
     */
    private final UserRepository userRepository;

    /**
     * 매칭 후보 벡터 검색 레포지토리
     */
    private final MatchCandidateRepository matchCandidateRepository;

    /**
     * 매칭 완료 시 컨퍼런스 저장 레포지토리
     */
    private final ConferenceRepository conferenceRepository;

    /**
     * 매칭 정책 설정값
     */
    private final MatchPolicy policy;

    /**
     * Hard Matching 점수 계산기
     */
    private final SurveySimilarityCalculator surveySimilarityCalculator;

    /**
     * 매칭 이벤트 전송기
     */
    private final MatchEventPublisher eventPublisher;

    /**
     * 기준 시각 제공용 Clock
     */
    private final Clock clock;

    /**
     * 매칭 처리 중 동시 충돌을 막기 위한 락
     */
    private final ReentrantLock matchLock = new ReentrantLock();

    /**
     * 즉시 매칭을 1회 시도하는 메서드
     *
     * @param item 대기열 항목
     * @param user 요청자 사용자
     * @return 매칭 성공 여부
     */
    public boolean tryImmediateMatch(MatchQueueItem item, User user) {
        matchLock.lock();

        try {
            log.info("즉시 매칭 시도. userId={}, requestId={}, threshold={}, topK={}", user.getId(), item.getRequestId(), policy.immediateSimilarityThreshold(), policy.immediateTopK());
            return tryMatch(item, user, policy.immediateSimilarityThreshold(), policy.immediateTopK());

        } finally {
            matchLock.unlock();
        }
    }

    /**
     * 대기열을 주기적으로 처리하는 메서드
     * <p>
     * 타임아웃 → 완화 → 배치 순서로 진행하며 종료 항목 정리까지 수행한다
     */
    @Transactional
    public void processQueue() {
        matchLock.lock();

        try {
            log.debug("매칭 대기열 처리 시작");

            // 타임아웃 -> 완화 매칭 -> 배치 매칭 순으로 처리
            processTimeouts();
            processRelaxedMatches();
            processBatchMatches();
            purgeFinished();

            log.debug("매칭 대기열 처리 완료");

        } finally {
            matchLock.unlock();
        }
    }

    /**
     * 종료 상태 항목을 정리하는 메서드
     * <p>
     * 정리 기준은 정책의 cleanupRetention 기준 시각이다
     */
    private void purgeFinished() {
        LocalDateTime cutoff = LocalDateTime.now(clock).minus(policy.cleanupRetention());
        matchQueueService.purgeFinished(cutoff);
    }

    /**
     * 타임아웃 기준을 넘긴 요청을 처리하는 메서드
     * <p>
     * 타임아웃 시점에는 임계치 없이 최종 후보를 시도한다
     */
    private void processTimeouts() {
        LocalDateTime now = LocalDateTime.now(clock);

        for (MatchQueueItem item : matchQueueService.findAllWaitingByMatchType(MatchType.QUICK)) {
            if (isOlderThan(item, now, policy.timeout())) {
                User user = userRepository.findById(item.getRequesterUserId())
                        .orElse(null);

                // 사용자 정보를 찾지 못하면 타임아웃 처리
                if (user == null) {
                    log.warn("타임아웃 처리: 사용자 없음. requestId={}, userId={}", item.getRequestId(), item.getRequesterUserId());

                    item.markTimeout();
                    publishTimeoutEvent(item);
                    continue;
                }

                // 타임아웃 시점에는 임계치 없이 최종 후보를 시도
                boolean matched = tryMatch(item, user, NO_THRESHOLD, policy.immediateTopK());
                if (!matched) {
                    log.info("타임아웃 매칭 실패. requestId={}, userId={}", item.getRequestId(), item.getRequesterUserId());

                    item.markTimeout();
                    publishTimeoutEvent(item);
                }
            }
        }
    }

    /**
     * 타임아웃 이벤트를 전송하는 메서드
     *
     * @param item 대기열 항목
     */
    private void publishTimeoutEvent(MatchQueueItem item) {
        QuickMatchStageEvent event = QuickMatchStageEvent.builder()
                .requestId(item.getRequestId().toString())
                .stage("timeout")
                .threshold(NO_THRESHOLD)
                .occurredAt(LocalDateTime.now(clock))
                .build();

        log.info("타임아웃 이벤트 전송. requestId={}, userId={}", item.getRequestId(), item.getRequesterUserId());
        eventPublisher.publish(item.getRequesterUserId(), SseEventType.QUICK_TIMEOUT, event);
    }

    /**
     * 완화 조건에 도달한 요청을 처리하는 메서드
     * <p>
     * 완화 임계치 기준으로 재매칭을 시도한다
     */
    private void processRelaxedMatches() {
        LocalDateTime now = LocalDateTime.now(clock);
        for (MatchQueueItem item : matchQueueService.findAllWaitingByMatchType(MatchType.QUICK)) {
            if (isOlderThan(item, now, policy.relaxDelay())) {
                if (item.getRelaxedAt() == null) {
                    item.markRelaxed(now);
                    publishRelaxedEvent(item, now);
                }

                User user = userRepository.findById(item.getRequesterUserId())
                        .orElse(null);

                if (user == null) {
                    log.warn("완화 매칭 스킵: 사용자 없음. requestId={}, userId={}", item.getRequestId(), item.getRequesterUserId());
                    continue;
                }

                // 완화 임계치로 다시 매칭 시도
                tryMatch(item, user, policy.relaxedSimilarityThreshold(), policy.immediateTopK());
            }
        }
    }

    /**
     * 일정 시간 이상 대기한 요청을 배치로 매칭하는 메서드
     * <p>
     * 최소/최대 인원 기준을 만족하는 경우 그리디 방식으로 매칭한다
     */
    private void processBatchMatches() {
        LocalDateTime now = LocalDateTime.now(clock);
        List<MatchQueueItem> candidates = new ArrayList<>();

        for (MatchQueueItem item : matchQueueService.findAllWaitingByMatchType(MatchType.QUICK)) {
            if (isOlderThan(item, now, policy.batchDelay())) {
                candidates.add(item);
            }
        }

        // 최소 인원이 모이지 않으면 배치 미실행
        if (candidates.size() < policy.batchMinSize()) {
            log.debug("배치 매칭 스킵: 인원 부족. candidates={}, minSize={}", candidates.size(), policy.batchMinSize());
            return;
        }

        // 오래 기다린 순으로 배치 구성
        candidates.sort(Comparator.comparing(MatchQueueItem::getCreatedAt));
        int batchSize = Math.min(policy.batchMaxSize(), candidates.size());
        List<MatchQueueItem> batch = new ArrayList<>(candidates.subList(0, batchSize));

        // 그리디 방식으로 배치 매칭 수행
        log.info("배치 매칭 실행. batchSize={}, threshold={}", batch.size(), policy.immediateSimilarityThreshold());
        matchBatch(batch, policy.immediateSimilarityThreshold());
    }

    /**
     * 단일 사용자 기준으로 후보를 조회해 매칭을 시도하는 메서드
     *
     * @param item      대기열 항목
     * @param user      요청자 사용자
     * @param threshold 유사도 임계치
     * @param limit     후보 상위 K
     * @return 매칭 성공 여부
     */
    private boolean tryMatch(MatchQueueItem item, User user, double threshold, int limit) {
        if (!item.isWaiting()) {
            return false;
        }

        if (user.getInterestsVector() == null) {
            log.warn("매칭 스킵: 관심 벡터 없음. userId={}, requestId={}", user.getId(), item.getRequestId());
            return false;
        }

        // 현재 대기열에서 자기 자신을 제외한 후보 목록 추출
        List<UUID> candidateIds = matchQueueService.findAllWaitingByMatchType(MatchType.QUICK)
                .stream()
                .map(MatchQueueItem::getRequesterUserId)
                .filter(id -> !id.equals(user.getId()))
                .toList();

        if (candidateIds.isEmpty()) {
            log.debug("매칭 후보 없음. userId={}, requestId={}", user.getId(), item.getRequestId());
            return false;
        }

        // 요청 필터를 도메인 전용 필터로 변환 (성별 이성 강제 적용)
        MatchFilters filters = applyOppositeGender(MatchFilters.from(item.getFilters()), user);
        LocalDate now = LocalDate.now(clock);
        LocalDate maxBirthDate = filters.ageMin() != null ? now.minusYears(filters.ageMin()) : null;
        LocalDate minBirthDate = filters.ageMax() != null ? now.minusYears(filters.ageMax()) : null;

        // pgvector 후보 조회(상위 K) 후 상호 필터/유사도 검증
        List<MatchCandidate> candidates = matchCandidateRepository.findQuickCandidates(
                user.getId(),
                VectorUtils.toVectorLiteral(user.getInterestsVector()),
                candidateIds,
                filters.gender() != null ? filters.gender().name() : null,
                filters.region() != null ? filters.region().name() : null,
                maxBirthDate,
                minBirthDate,
                limit
        );

        for (MatchCandidate candidate : candidates) {
            Optional<MatchQueueItem> candidateItem = matchQueueService.findUserRequestByMatchType(candidate.id(), MatchType.QUICK);
            if (candidateItem.isEmpty()) {
                continue;
            }

            MatchQueueItem targetItem = candidateItem.get();
            if (!targetItem.isWaiting()) {
                continue;
            }

            // 상대 사용자 정보 조회(벡터가 없으면 스킵)
            User targetUser = userRepository.findById(targetItem.getRequesterUserId())
                    .orElse(null);

            if (targetUser == null || targetUser.getInterestsVector() == null) {
                continue;
            }

            // 상대 필터 기준으로 현재 사용자를 검증 (성별 이성 강제 적용)
            if (!matchesFilters(user, applyOppositeGender(MatchFilters.from(targetItem.getFilters()), targetUser), now)) {
                continue;
            }

            // 양방향 임베딩 유사도 계산
            double forwardEmbedding = candidate.similarity() != null ? candidate.similarity() : 0.0;
            double reverseEmbedding = VectorUtils.cosineSimilarity(targetUser.getInterestsVector(), user.getInterestsVector());
            double embeddingSimilarity = Math.min(forwardEmbedding, reverseEmbedding);

            // Hard Matching 점수 계산
            double hardMatchScore = surveySimilarityCalculator.calculate(user.getDetailedInfo(), targetUser.getDetailedInfo());

            // 종합 유사도 산출
            double finalScore = (embeddingSimilarity * policy.embeddingWeight()) + (hardMatchScore * policy.hardMatchWeight());

            if (threshold >= 0 && finalScore < threshold) {
                continue;
            }

            // 상호 임계치 통과 시 매칭 확정
            Conference conference = createConference(user, targetUser);
            LocalDateTime matchedAt = LocalDateTime.now(clock);
            item.markMatched(matchedAt);
            targetItem.markMatched(matchedAt);
            publishMatchedEvent(item, targetItem, conference, matchedAt, finalScore);
            return true;
        }

        return false;
    }

    /**
     * 배치 내에서 매칭 가능한 쌍을 찾는 메서드
     *
     * @param batch     후보 배치
     * @param threshold 유사도 임계치
     */
    private void matchBatch(List<MatchQueueItem> batch, double threshold) {
        if (batch.size() < 2) {
            return;
        }

        // 배치에 포함된 사용자들의 정보를 한 번에 조회
        List<UUID> userIds = batch.stream().map(MatchQueueItem::getRequesterUserId).toList();
        List<User> users = userRepository.findAllById(userIds);
        LocalDate now = LocalDate.now(clock);

        while (batch.size() >= 2) {
            MatchPair bestPair = findBestPair(batch, users, now, threshold);

            // 매칭 가능한 쌍이 없으면 종료
            if (bestPair == null) {
                log.info("배치 매칭 종료: 매칭 쌍 없음. remaining={}", batch.size());
                return;
            }

            // 최적 매칭 쌍 확정 후 컨퍼런스 생성
            Conference conference = createConference(
                    findUser(users, bestPair.left().getRequesterUserId()),
                    findUser(users, bestPair.right().getRequesterUserId())
            );
            LocalDateTime matchedAt = LocalDateTime.now(clock);
            bestPair.left().markMatched(matchedAt);
            bestPair.right().markMatched(matchedAt);
            publishMatchedEvent(bestPair.left(), bestPair.right(), conference, matchedAt, bestPair.similarityScore());

            batch.remove(bestPair.left());
            batch.remove(bestPair.right());
        }
    }

    /**
     * 배치 내에서 가장 유사도가 높은 쌍을 찾는 메서드
     *
     * @param batch     후보 배치
     * @param users     배치 사용자 목록
     * @param now       기준 시각
     * @param threshold 유사도 임계치
     * @return 매칭 쌍, 없으면 null
     */
    private MatchPair findBestPair(List<MatchQueueItem> batch, List<User> users, LocalDate now, double threshold) {
        MatchPair bestPair = null;
        double bestSimilarity = -1.0;

        for (int i = 0; i < batch.size(); i++) {
            MatchQueueItem left = batch.get(i);
            User leftUser = findUser(users, left.getRequesterUserId());
            if (leftUser == null || leftUser.getInterestsVector() == null) {
                continue;
            }

            for (int j = i + 1; j < batch.size(); j++) {
                MatchQueueItem right = batch.get(j);
                User rightUser = findUser(users, right.getRequesterUserId());
                if (rightUser == null || rightUser.getInterestsVector() == null) {
                    continue;
                }

                // 서로의 필터 기준으로 양방향 검증 (성별 이성 강제 적용)
                if (!matchesFilters(leftUser, applyOppositeGender(MatchFilters.from(right.getFilters()), rightUser), now)) {
                    continue;
                }

                if (!matchesFilters(rightUser, applyOppositeGender(MatchFilters.from(left.getFilters()), leftUser), now)) {
                    continue;
                }

                // 양방향 임베딩 유사도 계산
                double embeddingSimilarity = Math.min(
                        VectorUtils.cosineSimilarity(leftUser.getInterestsVector(), rightUser.getInterestsVector()),
                        VectorUtils.cosineSimilarity(rightUser.getInterestsVector(), leftUser.getInterestsVector())
                );

                // Hard Matching 점수 계산
                double hardMatchScore = surveySimilarityCalculator.calculate(leftUser.getDetailedInfo(), rightUser.getDetailedInfo());

                // 종합 유사도 산출
                double finalScore = (embeddingSimilarity * policy.embeddingWeight()) + (hardMatchScore * policy.hardMatchWeight());

                if (finalScore < threshold) {
                    continue;
                }

                // 가장 높은 유사도 쌍을 선택
                if (finalScore > bestSimilarity) {
                    bestSimilarity = finalScore;
                    bestPair = new MatchPair(left, right, finalScore);
                }
            }
        }

        return bestPair;
    }

    /**
     * 사용자 목록에서 사용자 ID를 찾아 반환하는 메서드
     *
     * @param users  사용자 목록
     * @param userId 사용자 ID
     * @return 사용자, 없으면 null
     */
    private User findUser(List<User> users, UUID userId) {
        for (User user : users) {
            if (user.getId().equals(userId)) {
                return user;
            }
        }

        return null;
    }

    /**
     * 대상 사용자가 요청 필터를 만족하는지 확인하는 메서드
     *
     * @param target  대상 사용자
     * @param filters 요청 필터
     * @param now     기준 날짜
     * @return 조건 통과 여부
     */
    private boolean matchesFilters(User target, MatchFilters filters, LocalDate now) {
        if (filters.gender() != null && target.getGender() != filters.gender()) {
            return false;
        }

        if (filters.region() != null && target.getRegion() != filters.region()) {
            return false;
        }

        if (target.getBirthDate() == null) {
            // 나이 정보가 없으면 요청 필터도 비어있어야 통과
            return filters.ageMin() == null && filters.ageMax() == null;
        }

        int age = Period.between(target.getBirthDate(), now).getYears();
        if (filters.ageMin() != null && age < filters.ageMin()) {
            return false;
        }

        if (filters.ageMax() != null && age > filters.ageMax()) {
            return false;
        }

        return true;
    }

    /**
     * 매칭 완료 시 컨퍼런스와 참여자를 생성하는 메서드
     *
     * @param requester 요청자 사용자
     * @param recipient 수신자 사용자
     * @return 생성된 컨퍼런스
     */
    private Conference createConference(User requester, User recipient) {
        if (requester == null || recipient == null) {
            throw new BaseException(ErrorCode.USER_NOT_FOUND);
        }

        // 매칭 완료 시 컨퍼런스 저장(입장 전 대기 상태)
        Conference conference = Conference.builder()
                .status(ConferenceStatus.WAITING)
                .currentRound(0)
                .build();

        Conference savedConference = conferenceRepository.save(conference);
        log.info("매칭 컨퍼런스 생성. conferenceId={}, requesterId={}, recipientId={}",
                savedConference.getId(), requester.getId(), recipient.getId());

        return savedConference;
    }

    /**
     * 완화 단계 진입 이벤트를 전송하는 메서드
     *
     * @param item 대기열 항목
     * @param now  기준 시각
     */
    private void publishRelaxedEvent(MatchQueueItem item, LocalDateTime now) {
        QuickMatchStageEvent event = QuickMatchStageEvent.builder()
                .requestId(item.getRequestId().toString())
                .stage("relaxed")
                .threshold(policy.relaxedSimilarityThreshold())
                .occurredAt(now)
                .build();

        log.info("완화 단계 이벤트 전송. requestId={}, userId={}", item.getRequestId(), item.getRequesterUserId());
        eventPublisher.publish(item.getRequesterUserId(), SseEventType.QUICK_RELAXED, event);
    }

    /**
     * 매칭 완료 이벤트를 전송하는 메서드
     *
     * @param left            첫 번째 사용자 항목
     * @param right           두 번째 사용자 항목
     * @param conference      생성된 컨퍼런스
     * @param matchedAt       매칭 완료 시각
     * @param similarityScore 종합 유사도 점수 (0.0 ~ 1.0)
     */
    private void publishMatchedEvent(MatchQueueItem left, MatchQueueItem right, Conference conference, LocalDateTime matchedAt, double similarityScore) {
        String conferenceId = conference.getId() != null ? conference.getId().toString() : null;

        QuickMatchResultEvent leftEvent = QuickMatchResultEvent.builder()
                .requestId(left.getRequestId().toString())
                .status("matched")
                .queueType(left.getMatchType().name().toLowerCase())
                .matchedUserId(right.getRequesterUserId().toString())
                .conferenceId(conferenceId)
                .matchedAt(matchedAt)
                .similarityScore(similarityScore)
                .build();

        QuickMatchResultEvent rightEvent = QuickMatchResultEvent.builder()
                .requestId(right.getRequestId().toString())
                .status("matched")
                .queueType(right.getMatchType().name().toLowerCase())
                .matchedUserId(left.getRequesterUserId().toString())
                .conferenceId(conferenceId)
                .matchedAt(matchedAt)
                .similarityScore(similarityScore)
                .build();

        TransactionUtils.runAfterCommit(() -> {
            eventPublisher.publish(left.getRequesterUserId(), SseEventType.QUICK_MATCHED, leftEvent);
            eventPublisher.publish(right.getRequesterUserId(), SseEventType.QUICK_MATCHED, rightEvent);
        });

        log.info("빠른 매칭 완료 이벤트 예약. conferenceId={}, leftUserId={}, rightUserId={}", conferenceId, left.getRequesterUserId(), right.getRequesterUserId());
    }

    /**
     * 대기열 항목이 기준 시각보다 오래됐는지 확인하는 메서드
     *
     * @param item     대기열 항목
     * @param now      기준 시각
     * @param duration 허용 대기 시간
     * @return 오래된 항목이면 true
     */
    private boolean isOlderThan(MatchQueueItem item, LocalDateTime now, Duration duration) {
        return item.getCreatedAt().plus(duration).isBefore(now);
    }

    /**
     * 필터에 성별이 없으면 요청자의 반대 성별을 자동 설정하는 메서드
     *
     * @param filters 원본 필터
     * @param user    요청자
     * @return 성별이 보장된 필터
     */
    private MatchFilters applyOppositeGender(MatchFilters filters, User user) {
        if (filters.gender() != null) {
            return filters;
        }

        if (user.getGender() == null) {
            return filters;
        }

        Gender opposite = user.getGender() == Gender.MALE ? Gender.FEMALE : Gender.MALE;
        return new MatchFilters(filters.ageMin(), filters.ageMax(), opposite, filters.region());
    }

    /**
     * 배치 매칭에 사용하는 후보 쌍
     *
     * @param left  왼쪽 후보
     * @param right 오른쪽 후보
     */
    private record MatchPair(MatchQueueItem left, MatchQueueItem right, double similarityScore) {
    }
}
