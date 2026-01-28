package com.ssafy.unblur.domain.match.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * 매칭 설정 클래스
 */
@Configuration
public class MatchConfig {

    /**
     * 매칭 정책 기본값 생성
     *
     * @return 매칭 정책
     */
    @Bean
    public MatchPolicy matchPolicy() {
        return MatchPolicy.defaultPolicy();
    }

    /**
     * 라운드 시간 정책 기본값 생성
     *
     * @return 라운드 시간 정책
     */
    @Bean
    public RoundDurationPolicy roundDurationPolicy() {
        return RoundDurationPolicy.defaultPolicy();
    }

    /**
     * 라운드별 시간 제한 정책
     *
     * @param round1 1라운드 시간 (5분)
     * @param round2 2라운드 시간 (10분)
     * @param round3 3라운드 시간 (10분)
     * @param round4 4라운드 시간 (ZERO면 무제한)
     */
    public record RoundDurationPolicy(
            Duration round1,
            Duration round2,
            Duration round3,
            Duration round4
    ) {

        /**
         * 기본 라운드 시간 정책
         *
         * @return 기본 정책
         */
        public static RoundDurationPolicy defaultPolicy() {
            return new RoundDurationPolicy(
                    Duration.ofMinutes(5),   // 1라운드: 5분
                    Duration.ofMinutes(10),  // 2라운드: 10분
                    Duration.ofMinutes(10),  // 3라운드: 10분
                    Duration.ZERO            // 4라운드: 무제한
            );
        }

        /**
         * 라운드 번호에 따른 시간을 반환하는 메서드
         *
         * @param roundNumber 라운드 번호
         * @return 라운드 시간
         */
        public Duration getDuration(int roundNumber) {
            return switch (roundNumber) {
                case 1 -> round1;
                case 2 -> round2;
                case 3 -> round3;
                default -> round4;
            };
        }

        /**
         * 무제한 라운드인지 확인하는 메서드
         *
         * @param roundNumber 라운드 번호
         * @return 무제한이면 true
         */
        public boolean isUnlimited(int roundNumber) {
            return getDuration(roundNumber).isZero();
        }
    }

    /**
     * 매칭 정책 설정 값
     */
    public record MatchPolicy(
            /** 즉시 매칭 시 벡터 검색 상위 K */
            int immediateTopK,
            /** 미니 배치 최소 인원 */
            int batchMinSize,
            /** 미니 배치 최대 인원 */
            int batchMaxSize,
            /** 미니 배치 대기 시간 */
            Duration batchDelay,
            /** 완화 조건 적용까지 대기 시간 */
            Duration relaxDelay,
            /** 타임아웃 기준 */
            Duration timeout,
            /** 즉시 매칭 유사도 임계치 */
            double immediateSimilarityThreshold,
            /** 완화 매칭 유사도 임계치 */
            double relaxedSimilarityThreshold,
            /** 예상 대기 시간 계산용 평균 대기 초 */
            int averageWaitSeconds,
            /** 완료/취소 항목 정리 유지 시간 */
            java.time.Duration cleanupRetention
    ) {

        /**
         * 기획 기준에 따른 기본 매칭 정책
         *
         * <table border="1">
         *   <tr><th>파라미터</th><th>값</th></tr>
         *   <tr><td>즉시 매칭 시 벡터 검색 상위 K</td><td>10</td></tr>
         *   <tr><td>미니 배치 최소 인원</td><td>4</td></tr>
         *   <tr><td>미니 배치 최대 인원</td><td>6</td></tr>
         *   <tr><td>미니 배치 대기 시간</td><td>8초</td></tr>
         *   <tr><td>완화 조건 적용까지 대기 시간</td><td>20초</td></tr>
         *   <tr><td>타임아웃 기준</td><td>30초</td></tr>
         *   <tr><td>즉시 매칭 유사도 임계치(코사인)</td><td>0.7</td></tr>
         *   <tr><td>완화 매칭 유사도 임계치(코사인)</td><td>0.5</td></tr>
         *   <tr><td>예상 대기 시간 계산용 평균 대기 초</td><td>60</td></tr>
         *   <tr><td>완료/취소 항목 정리 유지 시간</td><td>10분</td></tr>
         * </table>
         *
         * @return 기본 매칭 정책
         */
        public static MatchPolicy defaultPolicy() {
            return new MatchPolicy(
                    10,
                    4,
                    6,
                    Duration.ofSeconds(8),
                    Duration.ofSeconds(20),
                    Duration.ofSeconds(30),
                    0.7,
                    0.5,
                    60,
                    Duration.ofMinutes(10)
            );
        }
    }

}
