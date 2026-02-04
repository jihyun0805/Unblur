package com.ssafy.unblur.domain.rtc.service.impl;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.domain.rtc.config.KurentoClientProvider;
import com.ssafy.unblur.domain.rtc.model.UserSession;
import com.ssafy.unblur.domain.rtc.service.KurentoRoomService;
import com.ssafy.unblur.domain.rtc.service.RtcParticipantStore;
import lombok.extern.slf4j.Slf4j;
import org.kurento.client.*;
import org.kurento.jsonrpc.JsonRpcClientClosedException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 인메모리 기반 Kurento 방 관리 구현체
 */
@Slf4j
@Service
public class InMemoryKurentoRoomService implements KurentoRoomService {

    /**
     * Kurento 클라이언트 제공자
     */
    private final KurentoClientProvider kurentoClientProvider;

    /**
     * 참가자 저장소
     */
    private final RtcParticipantStore participantStore;

    /**
     * S3 클라이언트 (MinIO)
     */
    private final S3Client s3Client;

    /**
     * MinIO 버킷 이름
     */
    private final String bucketName;
    private final Path recordingDir;

    /**
     * 방 정보 저장소
     */
    private final Map<UUID, Room> rooms = new ConcurrentHashMap<>();

    public InMemoryKurentoRoomService(
            KurentoClientProvider kurentoClientProvider,
            RtcParticipantStore participantStore,
            S3Client s3Client,
            @Value("${minio.bucket}") String bucketName,
            @Value("${recording.dir:/tmp}") String recordingDir
    ) {
        this.kurentoClientProvider = kurentoClientProvider;
        this.participantStore = participantStore;
        this.s3Client = s3Client;
        this.bucketName = bucketName;
        this.recordingDir = Path.of(recordingDir);
    }

    @Override
    public UserSession join(UUID conferenceId, UUID userId) {
        // 방이 없으면 새로 생성하고, 있으면 기존 방을 사용
        Room room = rooms.computeIfAbsent(conferenceId, this::createRoom);
        UserSession userSession = room.join(userId);

        // 참가자 저장소에 등록
        participantStore.add(conferenceId, userId);
        log.info("RTC 참가자 등록. conferenceId={}, userId={}, participantCount={}", conferenceId, userId, participantStore.getParticipantIds(conferenceId).size());

        return userSession;
    }

    @Override
    public String processOffer(UUID conferenceId, UUID userId, String sdpOffer) {
        Room room = getRoom(conferenceId);
        log.debug("RTC SDP offer 처리. conferenceId={}, userId={}, sdpLength={}", conferenceId, userId, sdpOffer != null ? sdpOffer.length() : 0);
        return room.processOffer(userId, sdpOffer);
    }

    @Override
    public void addIceCandidate(UUID conferenceId, UUID userId, IceCandidate candidate) {
        Room room = getRoom(conferenceId);
        log.debug("RTC ICE candidate 추가. conferenceId={}, userId={}, candidate={}", conferenceId, userId, candidate != null ? candidate.getCandidate() : null);
        room.addIceCandidate(userId, candidate);
    }

    @Override
    public void leave(UUID conferenceId, UUID userId) {
        // 참가자 저장소에서 제거
        participantStore.remove(conferenceId, userId);
        log.info("RTC 참가자 제거. conferenceId={}, userId={}, participantCount={}", conferenceId, userId, participantStore.getParticipantIds(conferenceId).size());

        Room room = rooms.get(conferenceId);
        if (room == null) {
            return;
        }

        room.leave(userId);
        if (room.isEmpty()) {
            rooms.remove(conferenceId);
            room.release();
            log.info("RTC 방 제거 완료. conferenceId={}", conferenceId);
        }
    }

    @Override
    public void startRecording(UUID conferenceId, int roundNumber) {
        Room room = getRoom(conferenceId);
        log.info("RTC 녹음 시작. conferenceId={}, roundNumber={}", conferenceId, roundNumber);
        room.startRecording(roundNumber);
    }

    @Override
    public void stopRecordingAndUpload(UUID conferenceId, int roundNumber) {
        Room room = getRoom(conferenceId);
        log.info("RTC 녹음 종료 및 업로드 시작. conferenceId={}, roundNumber={}", conferenceId, roundNumber);
        Path recordingPath = room.stopRecording();

        if (recordingPath == null || !Files.exists(recordingPath)) {
            log.warn("녹음 파일이 없습니다. conferenceId={}, roundNumber={}", conferenceId, roundNumber);
            return;
        }

        try {
            // MinIO에 업로드
            String objectKey = conferenceId + "_" + roundNumber + ".webm";
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(objectKey)
                    .contentType("audio/webm")
                    .build();

            s3Client.putObject(putRequest, RequestBody.fromFile(recordingPath));
            log.info("녹음 파일 업로드 완료. bucket={}, key={}", bucketName, objectKey);

            // 임시 파일 삭제
            Files.deleteIfExists(recordingPath);
            log.info("녹음 파일 삭제 완료. conferenceId={}, roundNumber={}", conferenceId, roundNumber);

        } catch (IOException e) {
            log.error("녹음 파일 업로드 실패. conferenceId={}, roundNumber={}", conferenceId, roundNumber, e);
            throw new BaseException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 방 정보를 조회하는 메서드
     *
     * @param conferenceId 방 ID
     * @return 방 객체
     */
    private Room getRoom(UUID conferenceId) {
        Room room = rooms.get(conferenceId);
        if (room == null) {
            log.warn("존재하지 않는 RTC 방 접근 시도. conferenceId={}", conferenceId);
            throw new BaseException(ErrorCode.CONFERENCE_NOT_FOUND);
        }

        return room;
    }

    /**
     * 새로운 방을 생성하는 메서드
     *
     * @param conferenceId 방 ID
     * @return 방 객체
     */
    private Room createRoom(UUID conferenceId) {
        try {
            log.info("RTC 방 생성. conferenceId={}", conferenceId);
            return new Room(kurentoClientProvider.get(), conferenceId, recordingDir);

        } catch (JsonRpcClientClosedException e) {
            log.warn("Kurento client closed. 재생성 시도. conferenceId={}", conferenceId);
            return new Room(kurentoClientProvider.recreate(), conferenceId, recordingDir);
        }
    }

    /**
     * Kurento 기반 방 내부 구조.
     */
    @Slf4j
    private static class Room {

        /**
         * 방 ID
         */
        private final UUID conferenceId;

        /**
         * 미디어 파이프라인
         */
        private final MediaPipeline pipeline;

        /**
         * 오디오 믹싱을 위한 Composite
         */
        private final Composite composite;

        /**
         * 참가자 맵
         * <p>
         * Key: 사용자 ID, Value: 사용자 세션
         */
        private final Map<UUID, UserSession> participants = new ConcurrentHashMap<>();

        /**
         * HubPort 맵
         * <p>
         * Key: 사용자 ID, Value: HubPort
         */
        private final Map<UUID, HubPort> hubPorts = new ConcurrentHashMap<>();

        /**
         * 녹음기 엔드포인트
         */
        private RecorderEndpoint recorder;

        /**
         * 녹음 파일 경로
         */
        private Path recordingPath;
        private final Path recordingDir;

        /**
         * 방 생성자
         *
         * @param kurentoClient Kurento 클라이언트
         * @param conferenceId  방 ID
         */
        Room(KurentoClient kurentoClient, UUID conferenceId, Path recordingDir) {
            this.conferenceId = conferenceId;
            this.pipeline = kurentoClient.createMediaPipeline();
            this.composite = new Composite.Builder(pipeline).build();
            this.recordingDir = recordingDir;
            log.info("RTC 방 생성. conferenceId={}", conferenceId);
        }

        /**
         * 사용자 입장을 처리하는 메서드
         *
         * @param userId 사용자 ID
         * @return 사용자 세션
         */
        UserSession join(UUID userId) {
            // 기존 세션이 있으면 정리
            if (participants.containsKey(userId)) {
                leave(userId);
                log.info("RTC 재입장 기존 세션 정리. conferenceId={}, userId={}", conferenceId, userId);
            }

            // WebRtcEndpoint 및 UserSession 생성
            WebRtcEndpoint endpoint = new WebRtcEndpoint.Builder(pipeline).build();
            UserSession userSession = new UserSession(userId, endpoint);
            participants.put(userId, userSession);

            // 오디오 믹싱을 위해 Composite에 연결
            HubPort hubPort = new HubPort.Builder(composite).build();
            endpoint.connect(hubPort, MediaType.AUDIO);
            hubPorts.put(userId, hubPort);

            log.info("RTC 사용자 입장. conferenceId={}, userId={}, size={}", conferenceId, userId, participants.size());

            return userSession;
        }

        /**
         * SDP Offer를 처리하고 Answer를 반환하는 메서드
         *
         * @param userId   사용자 ID
         * @param sdpOffer SDP Offer
         * @return SDP Answer
         */
        String processOffer(UUID userId, String sdpOffer) {
            UserSession userSession = getUserSession(userId);
            String sdpAnswer = userSession.webRtcEndpoint().processOffer(sdpOffer);
            userSession.webRtcEndpoint().gatherCandidates();

            // 1:1 연결을 위해 상대방과 양방향으로 연결
            for (UserSession other : participants.values()) {
                if (!other.userId().equals(userId)) {
                    userSession.webRtcEndpoint().connect(other.webRtcEndpoint());
                    other.webRtcEndpoint().connect(userSession.webRtcEndpoint());
                }
            }

            log.debug("RTC SDP 처리 완료. conferenceId={}, userId={}, participantCount={}", conferenceId, userId, participants.size());

            return sdpAnswer;
        }

        /**
         * ICE Candidate를 추가하는 메서드
         *
         * @param userId    사용자 ID
         * @param candidate ICE Candidate
         */
        void addIceCandidate(UUID userId, IceCandidate candidate) {
            UserSession userSession = getUserSession(userId);
            userSession.webRtcEndpoint().addIceCandidate(candidate);
        }

        /**
         * 방에서 사용자를 제거하는 메서드
         *
         * @param userId 사용자 ID
         */
        void leave(UUID userId) {
            // 참가자 및 HubPort 제거
            UserSession userSession = participants.remove(userId);
            HubPort hubPort = hubPorts.remove(userId);

            // 사용자 세션 해제
            if (userSession != null) {
                userSession.webRtcEndpoint().release();
                log.info("RTC 사용자 퇴장. conferenceId={}, userId={}, size={}", conferenceId, userId, participants.size());
            }

            // HubPort 해제
            if (hubPort != null) {
                hubPort.release();
            }
        }

        /**
         * 방이 비었는지 확인하는 메서드
         *
         * @return 비었으면 true
         */
        boolean isEmpty() {
            return participants.isEmpty();
        }

        /**
         * 라운드 녹음을 시작하는 메서드
         *
         * @param roundNumber 라운드 번호
         */
        void startRecording(int roundNumber) {
            try {
                // 임시 파일 생성
                String filename = conferenceId + "_" + roundNumber + ".webm";
                Files.createDirectories(recordingDir);
                this.recordingPath = Files.createTempFile(recordingDir, "kurento-recording-", "-" + filename);

                // RecorderEndpoint 생성 및 Composite 연결
                this.recorder = new RecorderEndpoint.Builder(pipeline, "file://" + recordingPath.toAbsolutePath())
                        .withMediaProfile(MediaProfileSpecType.WEBM_AUDIO_ONLY)
                        .build();

                // Composite의 출력 포트를 생성하여 RecorderEndpoint에 연결
                HubPort recorderPort = new HubPort.Builder(composite).build();
                recorderPort.connect(recorder, MediaType.AUDIO);

                recorder.record();
                log.info("녹음 시작. conferenceId={}, roundNumber={}, path={}", conferenceId, roundNumber, recordingPath);

            } catch (IOException e) {
                log.error("녹음 시작 실패. conferenceId={}, roundNumber={}", conferenceId, roundNumber, e);
                throw new BaseException(ErrorCode.INTERNAL_SERVER_ERROR);
            }
        }

        /**
         * 라운드 녹음을 중지하는 메서드
         *
         * @return 녹음 파일 경로
         */
        Path stopRecording() {
            if (recorder == null) {
                log.warn("녹음 중인 레코더가 없습니다. conferenceId={}", conferenceId);
                return null;
            }

            try {
                recorder.stop();
                recorder.release();
                log.info("녹음 중지. conferenceId={}, path={}", conferenceId, recordingPath);

            } catch (Exception e) {
                log.error("녹음 중지 실패. conferenceId={}", conferenceId, e);
            }

            Path path = this.recordingPath;
            this.recorder = null;
            this.recordingPath = null;
            return path;
        }

        /**
         * 리소스를 해제하는 메서드
         */
        void release() {
            // 녹음 중이면 중지
            if (recorder != null) {
                try {
                    recorder.stop();
                    recorder.release();
                } catch (Exception ignored) {
                }
            }
            pipeline.release();
            log.info("RTC 방 해제. conferenceId={}", conferenceId);
        }

        /**
         * 사용자 세션을 조회하는 메서드
         *
         * @param userId 사용자 ID
         * @return 사용자 세션
         */
        private UserSession getUserSession(UUID userId) {
            UserSession userSession = participants.get(userId);
            if (userSession == null) {
                log.warn("RTC 사용자 세션 없음. conferenceId={}, userId={}", conferenceId, userId);
                throw new BaseException(ErrorCode.USER_NOT_JOINED);
            }

            return userSession;
        }
    }
}
