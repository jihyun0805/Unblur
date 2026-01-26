package com.ssafy.unblur.domain.auth.model; // 패키지 경로를 확인해주세요

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * pgvector 타입을 String 리터럴로 변환하여 저장하는 컨버터
 */
@Converter
public class PgVectorConverter implements AttributeConverter<float[], String> {

    private static final int DIMENSION = 384;

    @Override
    public String convertToDatabaseColumn(float[] attribute) {
        if (attribute == null) {
            return null;
        }

        // float[] -> "[0.1,0.2,0.3...]" 문자열로 변환
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < attribute.length; i++) {
            sb.append(attribute[i]);
            if (i < attribute.length - 1) {
                sb.append(",");
            }
        }
        sb.append("]");
        return sb.toString();
    }

    @Override
    public float[] convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return null;
        }

        // "[0.1,0.2]" -> float[] 변환
        String cleanData = dbData.replace("[", "").replace("]", "");
        String[] parts = cleanData.split(",");
        float[] result = new float[parts.length];
        for (int i = 0; i < parts.length; i++) {
            result[i] = Float.parseFloat(parts[i].trim());
        }
        return result;
    }
}