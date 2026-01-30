package com.ssafy.unblur.domain.ai.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

import java.util.List;

@Builder
public record MinioEventRequest(
        @JsonProperty("Records") List<Record> records
) {
    @Builder
    public record Record(
            String eventName,
            S3 s3
    ) {
    }

    @Builder
    public record S3(
            Bucket bucket,
            S3Object object
    ) {
    }

    @Builder
    public record Bucket(
            String name
    ) {
    }

    @Builder
    public record S3Object(
            String key
    ) {
    }
}