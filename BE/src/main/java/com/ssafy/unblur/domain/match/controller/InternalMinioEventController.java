package com.ssafy.unblur.domain.match.controller;

import com.ssafy.unblur.common.dto.MinioEventRequest;
import com.ssafy.unblur.common.response.BaseResponse;
import com.ssafy.unblur.domain.match.service.AiSummaryPipelineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/internal/minio")
@RequiredArgsConstructor
public class InternalMinioEventController {

    private final AiSummaryPipelineService aiSummaryPipelineService;

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
            aiSummaryPipelineService.handleObjectCreated(
                    record.s3().bucket().name(),
                    record.s3().object().key()
            );
        });

        return ResponseEntity.ok(BaseResponse.onSuccess("minio event handled", null));
    }
}
