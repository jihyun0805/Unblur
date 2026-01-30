package com.ssafy.unblur.domain.ai.service;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.domain.match.model.ConferenceRound;
import com.ssafy.unblur.domain.match.repository.ConferenceRoundRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.web.client.RestClient;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiSummaryPipelineService {

    private static final Pattern FILENAME_PATTERN = Pattern.compile("^(.+)_([0-9]+)\\.[^./]+$");

    private final S3Client s3Client;
    @Qualifier("openAiRestClient")
    private final RestClient openAiRestClient;
    @Qualifier("geminiRestClient")
    private final RestClient geminiRestClient;
    private final ConferenceRoundRepository conferenceRoundRepository;

    @Transactional
    public void handleObjectCreated(String bucket, String objectKey) {
        String decodedKey = URLDecoder.decode(objectKey, StandardCharsets.UTF_8);
        String filename = decodedKey.substring(decodedKey.lastIndexOf('/') + 1);

        FileMeta meta = parseFilename(filename);
        Path tempFile = null;
        try {
            log.info("AI pipeline start: bucket={}, key={}", bucket, decodedKey);
            tempFile = Files.createTempFile("ai-summary-", "-" + filename);
            downloadFromMinio(bucket, decodedKey, tempFile);
            String transcript = transcribe(tempFile);
            String summary = summarize(transcript);
            ConferenceRound round = conferenceRoundRepository
                    .findByConference_IdAndRoundNumber(meta.conferenceId(), meta.roundNumber())
                    .orElseThrow(() -> new BaseException(ErrorCode.CONFERENCE_NOT_FOUND));
            round.updateSummary(summary);
            log.info("AI pipeline done: conferenceId={}, round={}", meta.conferenceId(), meta.roundNumber());
        } catch (IOException e) {
            log.error("AI pipeline IO error", e);
            throw new BaseException(ErrorCode.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            log.error("AI pipeline failed", e);
            throw e;
        } finally {
            if (tempFile != null) {
                try {
                    Files.deleteIfExists(tempFile);
                } catch (IOException ignored) {
                }
            }
        }
    }

    private void downloadFromMinio(String bucket, String objectKey, Path target) throws IOException {
        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(bucket)
                .key(objectKey)
                .build();
        try (InputStream in = s3Client.getObject(request)) {
            Files.copy(in, target, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
        }
    }

    private String transcribe(Path file) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", new FileSystemResource(file))
                .contentType(MediaType.parseMediaType("audio/mpeg"))
                .filename(file.getFileName().toString());
        builder.part("model", "whisper-1");

        try {
            log.info("STT request file size: {} bytes", Files.size(file));
        } catch (IOException e) {
            log.warn("STT file size check failed", e);
        }

        var response = openAiRestClient.post()
                .uri("/v1/audio/transcriptions")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(builder.build())
                .retrieve()
                .body(OpenAiTranscriptionResponse.class);

        if (response == null || response.text() == null || response.text().isBlank()) {
            throw new BaseException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
        return response.text();
    }

    private String summarize(String transcript) {
        String prompt = """
                System Role
                너는 대화의 맥락을 정리하는 '데이팅 앱 대화 요약용 브리핑 봇'이야.
                대화를 분석해 두 사람이 어떤 주제로 가장 오래 대화했는지 건조하고 담백하게 요약해줘.

                Constraints
                "두 분은~", "즐거우셨네요!" 같은 청유형이나 감탄사를 절대 쓰지 말 것.
                대화 내용만 근거로 객관적인 사실만 서술할 것.
                무엇에 대해 이야기했는지 명확히 명시할 것.(대화 주제가 명확히 드러나야 함)
                40자 이내, 한 문장
                존댓말로 작성할 것.
                메타 설명, 접속어, 목록 없이 문장만 출력

                대화 내용:
                """;

        GeminiRequest request = new GeminiRequest(List.of(
                new GeminiRequest.Content(List.of(
                        new GeminiRequest.Part(prompt + "\n" + transcript)
                ))
        ));

        GeminiResponse response = geminiRestClient.post()
                .uri("/v1beta/models/gemini-2.5-flash:generateContent")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(GeminiResponse.class);

        if (response == null || response.candidates == null || response.candidates.isEmpty()) {
            throw new BaseException(ErrorCode.INTERNAL_SERVER_ERROR);
        }

        GeminiResponse.Candidate candidate = response.candidates.get(0);
        if (candidate == null || candidate.content == null || candidate.content.parts == null
                || candidate.content.parts.isEmpty()) {
            throw new BaseException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
        String text = candidate.content.parts.get(0).text;
        if (text == null || text.isBlank()) {
            throw new BaseException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
        return text.trim();
    }

    private FileMeta parseFilename(String filename) {
        Matcher matcher = FILENAME_PATTERN.matcher(filename);
        if (!matcher.matches()) {
            throw new BaseException(ErrorCode.INVALID_INPUT_VALUE);
        }
        String conferenceId = matcher.group(1);
        int roundNumber = Integer.parseInt(matcher.group(2));
        return new FileMeta(java.util.UUID.fromString(conferenceId), roundNumber);
    }

    private record FileMeta(java.util.UUID conferenceId, int roundNumber) {
    }

    private record OpenAiTranscriptionResponse(String text) {
    }

    private record GeminiRequest(List<Content> contents) {
        private record Content(List<Part> parts) {
        }
        private record Part(String text) {
        }
    }

    private record GeminiResponse(List<Candidate> candidates) {
        private record Candidate(Content content) {
        }
        private record Content(List<Part> parts) {
        }
        private record Part(String text) {
        }
    }
}

