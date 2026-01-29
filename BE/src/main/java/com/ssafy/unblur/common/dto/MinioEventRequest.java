package com.ssafy.unblur.common.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record MinioEventRequest(
        @JsonProperty("Records") List<Record> records
) {
    public record Record(
            String eventName,
            S3 s3
    ) {
    }

    public record S3(
            Bucket bucket,
            S3Object object
    ) {
    }

    public record Bucket(
            String name
    ) {
    }

    public record S3Object(
            String key
    ) {
    }
}
