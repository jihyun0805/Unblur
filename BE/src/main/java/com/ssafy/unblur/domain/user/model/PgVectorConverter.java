package com.ssafy.unblur.domain.user.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.postgresql.util.PGobject;

import java.sql.SQLException;

/**
 * PostgreSQL pgvector 타입을 JPA에서 쉽게 다루기 위한 변환기.
 * <p>
 * - 애플리케이션에서는 {@code float[]}로 다루고
 * - DB에는 {@code vector(384)} 형태로 저장합니다.
 * </p>
 * <p>
 * pgvector 리터럴 형식: {@code [0.1,0.2,...]}
 * </p>
 */
@Converter(autoApply = false)
public class PgVectorConverter implements AttributeConverter<float[], PGobject> {

    private static final int EXPECTED_DIMENSION = 384;

    @Override
    /**
     * Java 배열을 pgvector 리터럴로 변환합니다.
     *
     * @param attribute 384차원 벡터
     * @return pgvector 타입 PGobject
     */
    public PGobject convertToDatabaseColumn(float[] attribute) {
        if (attribute == null) {
            return null;
        }
        if (attribute.length != EXPECTED_DIMENSION) {
            throw new IllegalArgumentException("interestsVector must have length " + EXPECTED_DIMENSION);
        }

        PGobject pgObject = new PGobject();
        pgObject.setType("vector");
        try {
            pgObject.setValue(toVectorLiteral(attribute));
        } catch (SQLException e) {
            throw new IllegalArgumentException("Failed to convert vector to PGobject", e);
        }
        return pgObject;
    }

    @Override
    /**
     * pgvector 리터럴을 Java 배열로 변환합니다.
     *
     * @param dbData DB에서 읽은 pgvector
     * @return 384차원 float 배열
     */
    public float[] convertToEntityAttribute(PGobject dbData) {
        if (dbData == null || dbData.getValue() == null) {
            return null;
        }
        return parseVector(dbData.getValue());
    }

    /**
     * {@code float[]} -> pgvector 리터럴 변환.
     */
    private String toVectorLiteral(float[] attribute) {
        StringBuilder builder = new StringBuilder("[");
        for (int i = 0; i < attribute.length; i++) {
            if (i > 0) {
                builder.append(',');
            }
            builder.append(attribute[i]);
        }
        builder.append(']');
        return builder.toString();
    }

    /**
     * pgvector 리터럴 -> {@code float[]} 변환.
     */
    private float[] parseVector(String value) {
        String trimmed = value.trim();
        if (trimmed.length() < 2) {
            return new float[0];
        }
        String body = trimmed.substring(1, trimmed.length() - 1).trim();
        if (body.isEmpty()) {
            return new float[0];
        }
        String[] parts = body.split(",");
        float[] result = new float[parts.length];
        for (int i = 0; i < parts.length; i++) {
            result[i] = Float.parseFloat(parts[i].trim());
        }
        if (result.length != EXPECTED_DIMENSION) {
            throw new IllegalArgumentException("interestsVector must have length " + EXPECTED_DIMENSION
                    + " but was " + result.length);
        }
        return result;
    }
}
