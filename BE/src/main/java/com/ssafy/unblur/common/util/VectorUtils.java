package com.ssafy.unblur.common.util;

/**
 * 벡터 유틸리티 클래스
 */
public final class VectorUtils {

    private VectorUtils() {
    }

    /**
     * 벡터 리터럴 변환하는 메서드
     *
     * @param vector 벡터 배열
     * @return pgvector 리터럴
     */
    public static String toVectorLiteral(float[] vector) {
        if (vector == null) {
            return null;
        }

        StringBuilder builder = new StringBuilder("[");
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) {
                builder.append(',');
            }

            builder.append(vector[i]);
        }

        builder.append(']');
        return builder.toString();
    }

    /**
     * 두 벡터의 코사인 유사도 계산하는 메서드
     *
     * @param a 벡터 A
     * @param b 벡터 B
     * @return 유사도
     */
    public static double cosineSimilarity(float[] a, float[] b) {
        if (a == null || b == null) {
            return -1.0;
        }

        int length = Math.min(a.length, b.length);
        double dot = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        for (int i = 0; i < length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        if (normA == 0.0 || normB == 0.0) {
            return -1.0;
        }

        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
