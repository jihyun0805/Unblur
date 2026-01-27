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
