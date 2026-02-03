"use client"

/**
 * 카메라/마이크 권한·스트림 동기화에 쓰는 공통 유틸
 * use-webrtc, camera-test-modal 등에서 공유
 */

export type MediaKind = "video" | "audio"

/** 세션용 비디오 제약 (640x480) */
export const VIDEO_CONSTRAINTS_SESSION: MediaTrackConstraints = {
  facingMode: "user",
  width: 640,
  height: 480,
}

/** 카메라 테스트/미리보기용 비디오 제약 (1280x720) */
export const VIDEO_CONSTRAINTS_PREVIEW: MediaTrackConstraints = {
  facingMode: "user",
  width: { ideal: 1280 },
  height: { ideal: 720 },
}

/**
 * 끝난 트랙을 제외한 새 MediaStream 생성.
 * 활성 트랙이 없으면 null 반환.
 */
export function buildStreamWithoutEndedTracks(stream: MediaStream): MediaStream | null {
  const active = stream.getTracks().filter((t) => t.readyState !== "ended")
  if (active.length === 0) return null
  return new MediaStream(active)
}

/**
 * 스트림의 모든 트랙에 ended 리스너 부착 (한 번만 호출).
 * @param onEnded 끝난 트랙을 인자로 호출 (video/audio 구분 가능)
 */
export function attachTrackEndedListeners(
  stream: MediaStream,
  onEnded: (track: MediaStreamTrack) => void
): void {
  stream.getTracks().forEach((track) => {
    track.addEventListener("ended", () => onEnded(track), { once: true })
  })
}

/**
 * 권한이 'granted'로 바뀔 때 onGranted 호출.
 * 지원하지 않는 환경에서는 아무것도 하지 않음.
 * @returns 구독 해제 함수
 */
export function subscribeToPermissionChange(
  name: "camera" | "microphone",
  onGranted: () => void
): () => void {
  if (typeof navigator?.permissions?.query !== "function") return () => {}
  let unsub: (() => void) | null = null
  navigator.permissions
    .query({ name } as PermissionDescriptor)
    .then((status) => {
      const handler = () => status.state === "granted" && onGranted()
      status.addEventListener("change", handler)
      unsub = () => status.removeEventListener("change", handler)
    })
    .catch(() => {})
  return () => unsub?.()
}

/**
 * kind에 맞는 getUserMedia 제약 반환
 */
export function getMediaConstraints(
  kind: MediaKind,
  videoConstraints: MediaTrackConstraints = VIDEO_CONSTRAINTS_SESSION
): MediaStreamConstraints {
  return kind === "video"
    ? { video: videoConstraints, audio: false }
    : { video: false, audio: true }
}
