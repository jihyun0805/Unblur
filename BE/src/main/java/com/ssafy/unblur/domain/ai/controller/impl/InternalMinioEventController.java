package com.ssafy.unblur.domain.ai.controller.impl;

import com.ssafy.unblur.domain.ai.dto.request.MinioEventRequest;
import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.domain.ai.service.AiSummaryPipelineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.task.TaskExecutor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/internal/minio")
@RequiredArgsConstructor
@Slf4j
public class InternalMinioEventController {

    private final AiSummaryPipelineService aiSummaryPipelineService;
    private final TaskExecutor taskExecutor;

    @PostMapping("/events")
    public ResponseEntity<BaseResponse<Void>> handleEvent(@RequestBody MinioEventRequest request) {
        if (request.records() == null || request.records().isEmpty()) {
            return ResponseEntity.ok(BaseResponse.onSuccess("no records", null));
        }

        request.records().forEach(record -> {
            if (record == null || record.s3() == null || record.s3().bucket() == null || record.s3().object() == null) {
                return;
            }
            String eventName = record.eventName();
            if (eventName != null && !eventName.startsWith("s3:ObjectCreated")) {
                return;
            }
            String bucket = record.s3().bucket().name();
            String key = record.s3().object().key();
            taskExecutor.execute(() -> {
                try {
                    aiSummaryPipelineService.handleObjectCreated(bucket, key);
                } catch (Exception e) {
                    log.error("AI pipeline async failed: bucket={}, key={}", bucket, key, e);
                }
            });
        });

        return ResponseEntity.ok(BaseResponse.onSuccess("minio event handled", null));
    }
}
