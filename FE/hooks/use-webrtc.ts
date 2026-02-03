"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { flushSync } from "react-dom"
import { createSignalingClient, type SignalingMessage, type VoteChoice, type WebRTCSignalingClient } from "@/lib/webrtc-signaling"
import { registerStream, unregisterStream } from "@/lib/media-streams"
import {
  buildStreamWithoutEndedTracks,
  attachTrackEndedListeners as attachTrackEndedListenersUtil,
  subscribeToPermissionChange,
  getMediaConstraints,
  VIDEO_CONSTRAINTS_SESSION,
  type MediaKind,
} from "@/lib/media-permission-utils"

/** 라운드 시간 종료 시 투표 모달 표시 */
export type RoundTimeUpPayload = { conferenceId: string; roundNumber: number; message?: string }
/** 새 라운드 시작 시 다음 라운드로 전환 */
export type RoundStartedPayload = { conferenceId: string; roundNumber: number; isUnlimited: boolean; roundEndsAt?: number | null }

export interface UseWebRTCOptions {
  sessionId: string
  userId: string
  localVideoRef: React.RefObject<HTMLVideoElement | null> | React.MutableRefObject<HTMLVideoElement | null>
  remoteVideoRef: React.RefObject<HTMLVideoElement | null> | React.MutableRefObject<HTMLVideoElement | null>
  enabled?: boolean
  useMock?: boolean
  wsUrl?: string
  onDisconnected?: () => void
  onRoundTimeUp?: (payload: RoundTimeUpPayload) => void
  onRoundStarted?: (payload: RoundStartedPayload) => void
  onVoteConfirmRequest?: () => void
  onConferenceEnded?: () => void
  /** 조인 전에 세션 종료/에러 시 호출 (종료된 세션 재진입 방지) */
  onInvalidSession?: () => void
}

export interface UseWebRTCReturn {
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isConnected: boolean
  isConnecting: boolean
  hasJoined: boolean
  error: string | null
  toggleMute: () => void
  isMuted: boolean
  toggleVideo: () => void
  isVideoEnabled: boolean
  /** 상대방 비디오 트랙이 mute 상태(데이터 미수신)인지 */
  remoteVideoMuted: boolean
  /** 상대방 오디오 트랙이 mute 상태(데이터 미수신)인지 */
  remoteAudioMuted: boolean
  sendVote: (vote: VoteChoice) => void
  leaveSession: () => void
  replaceVideoTrack: (processedStream: MediaStream | null) => void
  signalingClient: WebRTCSignalingClient | null
}

// const ICE_SERVERS: RTCConfiguration = {
//   iceServers: [
//     { urls: ["stun:i14a705.p.ssafy.io:8000"] },
//
//     // TURN
//     {
//       urls: ["turn:i14a705.p.ssafy.io:8000?transport=tcp"],
//       username: "A705",
//       credential: "wQ9pX3!Zt7b#V2mN4sC8"
//     }
//   ]
// }

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    {
      urls: ["turn:i14a705.p.ssafy.io:8000?transport=tcp"],
      username: "A705",
      credential: "wQ9pX3!Zt7b#V2mN4sC8",
    },
  ],
  iceTransportPolicy: "relay", // TURN만 쓰게 강제(테스트용)
}

export function useWebRTC({
  sessionId,
  userId,
  localVideoRef,
  remoteVideoRef,
  enabled = true,
  useMock = false,
  wsUrl,
  onDisconnected,
  onRoundTimeUp,
  onRoundStarted,
  onVoteConfirmRequest,
  onConferenceEnded,
  onInvalidSession,
}: UseWebRTCOptions): UseWebRTCReturn {
  const onRoundTimeUpRef = useRef(onRoundTimeUp)
  const onRoundStartedRef = useRef(onRoundStarted)
  const onVoteConfirmRequestRef = useRef(onVoteConfirmRequest)
  const onConferenceEndedRef = useRef(onConferenceEnded)
  const onInvalidSessionRef = useRef(onInvalidSession)
  const onDisconnectedRef = useRef(onDisconnected)
  const hasJoinedRef = useRef(false)
  onRoundTimeUpRef.current = onRoundTimeUp
  onRoundStartedRef.current = onRoundStarted
  onVoteConfirmRequestRef.current = onVoteConfirmRequest
  onConferenceEndedRef.current = onConferenceEnded
  onInvalidSessionRef.current = onInvalidSession
  onDisconnectedRef.current = onDisconnected
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [remoteVideoMuted, setRemoteVideoMuted] = useState(false)
  const [remoteAudioMuted, setRemoteAudioMuted] = useState(false)
  const [signalingReady, setSignalingReady] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const signalingClientRef = useRef<WebRTCSignalingClient | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([])
  const isMutedRef = useRef(isMuted)
  const isVideoEnabledRef = useRef(isVideoEnabled)

  useEffect(() => {
    hasJoinedRef.current = hasJoined
  }, [hasJoined])
  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])
  useEffect(() => {
    isVideoEnabledRef.current = isVideoEnabled
  }, [isVideoEnabled])

  const syncLocalStreamWithoutEndedTracks = useCallback(() => {
    const current = localStreamRef.current
    if (!current) return
    const next = buildStreamWithoutEndedTracks(current)
    unregisterStream(current)
    localStreamRef.current = next
    setLocalStream(next)
    if (localVideoRef.current) localVideoRef.current.srcObject = next
    if (next) registerStream(next)
  }, [localVideoRef])

  const attachTrackEndedListeners = useCallback(
    (stream: MediaStream) => {
      attachTrackEndedListenersUtil(stream, (track) => {
        if (track.kind === "video") setIsVideoEnabled(false)
        else if (track.kind === "audio") setIsMuted(true)
        syncLocalStreamWithoutEndedTracks()
      })
    },
    [syncLocalStreamWithoutEndedTracks]
  )

  const initLocalStream = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("MediaDevices API를 사용할 수 없습니다")
    }
    let videoStream: MediaStream | null = null
    let audioStream: MediaStream | null = null
    let cameraError: string | null = null
    let micError: string | null = null

    try {
      videoStream = await navigator.mediaDevices.getUserMedia({ video: VIDEO_CONSTRAINTS_SESSION, audio: false })
      console.log("[WebRTC] Camera access granted")
    } catch (err: any) {
      console.error("[WebRTC] Camera access error:", err?.name, err?.message)
      cameraError = err?.name === "NotAllowedError" ? "카메라 권한이 거부되었습니다." : "카메라에 접근할 수 없습니다."
    }
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
      console.log("[WebRTC] Microphone access granted")
    } catch (err: any) {
      console.error("[WebRTC] Microphone access error:", err?.name, err?.message)
      micError = err?.name === "NotAllowedError" ? "마이크 권한이 거부되었습니다." : "마이크에 접근할 수 없습니다."
    }
    if (!videoStream && !audioStream) {
      const msg = [cameraError, micError].filter(Boolean).join(" ") || "카메라/마이크에 접근할 수 없습니다"
      setError(msg)
      throw new Error(msg)
    }
    if (cameraError || micError) setError([cameraError, micError].filter(Boolean).join(" "))

    const combined = new MediaStream()
    if (videoStream) videoStream.getVideoTracks().forEach((t) => { t.enabled = isVideoEnabledRef.current; combined.addTrack(t) })
    if (audioStream) audioStream.getAudioTracks().forEach((t) => { t.enabled = !isMutedRef.current; combined.addTrack(t) })
    localStreamRef.current = combined
    setLocalStream(combined)
    registerStream(combined)
    if (localVideoRef.current) localVideoRef.current.srcObject = combined
    attachTrackEndedListeners(combined)
    return combined
  }, [localVideoRef, attachTrackEndedListeners])

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current!))
    }

    const attachRemoteTrackMuteListeners = (track: MediaStreamTrack) => {
      const onMute = () => {
        if (track.kind === "video") setRemoteVideoMuted(true)
        else if (track.kind === "audio") setRemoteAudioMuted(true)
      }
      const onUnmute = () => {
        if (track.kind === "video") setRemoteVideoMuted(false)
        else if (track.kind === "audio") setRemoteAudioMuted(false)
      }
      track.addEventListener("mute", onMute)
      track.addEventListener("unmute", onUnmute)
      if (track.muted) onMute()
      return () => {
        track.removeEventListener("mute", onMute)
        track.removeEventListener("unmute", onUnmute)
      }
    }

    pc.ontrack = (event) => {
      const track = event.track
      console.log("[WebRTC] Received remote track", track.kind)
      attachRemoteTrackMuteListeners(track)
      let stream = remoteStreamRef.current
      if (!stream) {
        stream = new MediaStream()
        remoteStreamRef.current = stream
      }
      if (!stream.getTracks().some((t) => t.id === track.id)) stream.addTrack(track)
      setRemoteStream(stream)
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream
        remoteVideoRef.current.play().catch(() => {})
      }
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && signalingClientRef.current) {
        signalingClientRef.current.sendIceCandidate(
          { candidate: event.candidate.candidate, sdpMLineIndex: event.candidate.sdpMLineIndex, sdpMid: event.candidate.sdpMid },
          sessionId,
          userId
        )
      }
    }

    pc.onconnectionstatechange = () => {
      setIsConnected(pc.connectionState === "connected")
      setIsConnecting(pc.connectionState === "connecting")
    }
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") pc.restartIce()
    }
    return pc
  }, [sessionId, userId, remoteVideoRef])

  const createOffer = useCallback(async () => {
    if (!peerConnectionRef.current || !signalingClientRef.current) return
    try {
      const offer = await peerConnectionRef.current.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
      await peerConnectionRef.current.setLocalDescription(offer)
      signalingClientRef.current.sendOffer(offer, sessionId, userId)
      console.log("[WebRTC] Offer created and sent")
    } catch (err) {
      console.error("[WebRTC] Failed to create offer:", err)
      setError("연결 설정에 실패했습니다")
    }
  }, [sessionId, userId])

  const drainPendingIceCandidates = useCallback((pc: RTCPeerConnection) => {
    const pending = pendingIceCandidatesRef.current.splice(0, pendingIceCandidatesRef.current.length)
    pending.forEach((c) => {
      pc.addIceCandidate(new RTCIceCandidate(c)).catch((e) => console.error("[WebRTC] addIceCandidate (drain):", e))
    })
  }, [])

  const reacquireMedia = useCallback(
    async (kind: MediaKind) => {
      const pc = peerConnectionRef.current
      if (!navigator.mediaDevices?.getUserMedia || !pc) return
      const currentStream = localStreamRef.current
      const isVideo = kind === "video"
      try {
        const stream = await navigator.mediaDevices.getUserMedia(
          getMediaConstraints(kind, VIDEO_CONSTRAINTS_SESSION)
        )
        const newTrack = (isVideo ? stream.getVideoTracks()[0] : stream.getAudioTracks()[0]) ?? null
        if (!newTrack) return
        newTrack.enabled = isVideo ? isVideoEnabledRef.current : !isMutedRef.current

        const sender = pc.getSenders().find((s) => s.track?.kind === kind)
        if (sender) {
          await sender.replaceTrack(newTrack)
        } else {
          pc.addTrack(newTrack, currentStream ?? new MediaStream())
          if (signalingClientRef.current) {
            const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
            await pc.setLocalDescription(offer)
            signalingClientRef.current.sendOffer(offer, sessionId, userId)
          }
        }

        // 오디오만 재획득 시 기존 스트림에 트랙만 교체해 비디오 요소 srcObject를 바꾸지 않음 → 깜빡임 방지
        if (!isVideo && currentStream) {
          currentStream.getAudioTracks().forEach((t) => {
            currentStream.removeTrack(t)
            t.stop()
          })
          currentStream.addTrack(newTrack)
          newTrack.addEventListener(
            "ended",
            () => {
              setIsMuted(true)
              syncLocalStreamWithoutEndedTracks()
            },
            { once: true }
          )
          setIsMuted(false)
          setError((prev) => (prev?.includes("마이크") ? prev.replace(/마이크[^.]*\.?/g, "").trim() || null : prev))
          return
        }

        const otherTracks =
          currentStream?.getTracks().filter((t) => t.readyState !== "ended" && t.kind !== kind) ?? []
        const nextStream = new MediaStream([...otherTracks, newTrack])
        attachTrackEndedListeners(nextStream)
        if (currentStream) unregisterStream(currentStream)
        localStreamRef.current = nextStream
        setLocalStream(nextStream)
        registerStream(nextStream)
        if (localVideoRef.current) localVideoRef.current.srcObject = nextStream

        if (isVideo) {
          setIsVideoEnabled(true)
          setError((prev) => (prev?.includes("카메라") ? prev.replace(/카메라[^.]*\.?/g, "").trim() || null : prev))
        } else {
          setIsMuted(false)
          setError((prev) => (prev?.includes("마이크") ? prev.replace(/마이크[^.]*\.?/g, "").trim() || null : prev))
        }
      } catch (err: any) {
        if (err?.name === "NotAllowedError") return // 사용자가 아직 권한 미허용(포커스만 돌아온 경우 등)
        console.error("[WebRTC] reacquireMedia failed:", kind, err)
      }
    },
    [sessionId, userId, localVideoRef, attachTrackEndedListeners, syncLocalStreamWithoutEndedTracks]
  )

  const createAnswer = useCallback(
    async (offer: RTCSessionDescriptionInit) => {
      if (!peerConnectionRef.current || !signalingClientRef.current) return
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer))
        drainPendingIceCandidates(peerConnectionRef.current)
        const answer = await peerConnectionRef.current.createAnswer()
        await peerConnectionRef.current.setLocalDescription(answer)
        signalingClientRef.current.sendAnswer(answer, sessionId, userId)
        console.log("[WebRTC] Answer created and sent")
      } catch (err) {
        console.error("[WebRTC] Failed to create answer:", err)
        setError("연결 설정에 실패했습니다")
      }
    },
    [sessionId, userId, drainPendingIceCandidates]
  )

  useEffect(() => {
    if (!enabled || !signalingReady || !signalingClientRef.current) return
    const handleMessage = (message: SignalingMessage) => {
      if ("sessionId" in message && message.sessionId !== sessionId) return
      switch (message.type) {
        case "offer":
          createAnswer(message.sdp)
          break
        case "answer": {
          const pc = peerConnectionRef.current
          if (!pc) break
          pc.setRemoteDescription(new RTCSessionDescription(message.sdp))
            .then(() => {
              drainPendingIceCandidates(pc)
              const attachRemoteTrackMuteListeners = (track: MediaStreamTrack) => {
                const onMute = () => {
                  if (track.kind === "video") setRemoteVideoMuted(true)
                  else if (track.kind === "audio") setRemoteAudioMuted(true)
                }
                const onUnmute = () => {
                  if (track.kind === "video") setRemoteVideoMuted(false)
                  else if (track.kind === "audio") setRemoteAudioMuted(false)
                }
                track.addEventListener("mute", onMute)
                track.addEventListener("unmute", onUnmute)
                if (track.muted) onMute()
              }
              const collect = () => {
                const conn = peerConnectionRef.current
                if (!conn) return
                let stream = remoteStreamRef.current
                if (!stream) {
                  stream = new MediaStream()
                  remoteStreamRef.current = stream
                }
                conn.getReceivers().forEach((r) => {
                  const track = r.track
                  if (track && !stream!.getTracks().some((t) => t.id === track.id)) {
                    stream!.addTrack(track)
                    attachRemoteTrackMuteListeners(track)
                  }
                })
                if (stream.getTracks().length > 0) {
                  setRemoteStream(stream)
                  if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = stream
                    remoteVideoRef.current.play().catch(() => {})
                  }
                }
              }
              collect()
              setTimeout(collect, 100)
              setTimeout(collect, 500)
            })
            .catch((err) => console.error("[WebRTC] Failed to set remote description:", err))
          break
        }
        case "ice-candidate":
          if (!peerConnectionRef.current || !message.candidate) break
          const pc = peerConnectionRef.current
          if (pc.remoteDescription) {
            pc.addIceCandidate(new RTCIceCandidate(message.candidate)).catch((e) => console.error("[WebRTC] addIceCandidate:", e))
          } else {
            pendingIceCandidatesRef.current.push(message.candidate)
          }
          break
        case "joined":
          hasJoinedRef.current = true
          setHasJoined(true)
          break
        case "connected":
          break
        case "error":
          setError(message.message)
          if (!hasJoinedRef.current) onInvalidSessionRef.current?.()
          break
        case "disconnected":
          setIsConnected(false)
          signalingClientRef.current?.disconnect()
          signalingClientRef.current = null
          onDisconnected?.()
          break
        case "round-time-up":
          if (message.type === "round-time-up") onRoundTimeUpRef.current?.({ conferenceId: message.conferenceId, roundNumber: message.roundNumber, message: message.message })
          break
        case "round-started":
          if (message.type === "round-started") onRoundStartedRef.current?.({ conferenceId: message.conferenceId, roundNumber: message.roundNumber, isUnlimited: message.isUnlimited, roundEndsAt: message.roundEndsAt ?? null })
          break
        case "vote-confirm-request":
          onVoteConfirmRequestRef.current?.()
          break
        case "conference-ended":
          if (!hasJoinedRef.current) onInvalidSessionRef.current?.()
          onConferenceEndedRef.current?.()
          break
      }
    }
    const unsub = signalingClientRef.current.onMessage(handleMessage)
    return unsub
  }, [enabled, signalingReady, sessionId, createAnswer, createOffer, onDisconnected, drainPendingIceCandidates])

  useEffect(() => {
    if (!enabled || !signalingReady || !localStream) return
    const unsubs: Array<() => void> = [
      subscribeToPermissionChange("camera", () => reacquireMedia("video")),
      subscribeToPermissionChange("microphone", () => reacquireMedia("audio")),
    ]
    const onWindowFocus = async () => {
      const pc = peerConnectionRef.current
      const current = localStreamRef.current
      if (!pc || !navigator.mediaDevices?.getUserMedia) return
      const needsVideo = !current?.getVideoTracks().some((t) => t.readyState === "live")
      const needsAudio = !current?.getAudioTracks().some((t) => t.readyState === "live")
      if (needsVideo) await reacquireMedia("video")
      if (needsAudio) await reacquireMedia("audio")
    }
    window.addEventListener("focus", onWindowFocus)
    unsubs.push(() => window.removeEventListener("focus", onWindowFocus))
    return () => unsubs.forEach((fn) => fn())
  }, [enabled, signalingReady, localStream, reacquireMedia])

  useEffect(() => {
    if (!enabled || !sessionId || !userId) return
    let mounted = true
    const init = async () => {
      try {
        setIsConnecting(true)
        setError(null)
        await initLocalStream()
        const client = createSignalingClient(wsUrl, useMock)
        signalingClientRef.current = client
        await client.connect(sessionId, userId)
        if (!mounted) return
        setSignalingReady(true)
        pendingIceCandidatesRef.current = []
        const pc = createPeerConnection()
        peerConnectionRef.current = pc
        if (!mounted) {
          pc.close()
          client.disconnect()
          return
        }
        setTimeout(() => {
          if (mounted && signalingClientRef.current && peerConnectionRef.current) createOffer()
        }, 500)
      } catch (err: any) {
        console.error("[WebRTC] Initialization failed:", err)
        setError(err.message || "WebRTC 초기화에 실패했습니다")
        setIsConnecting(false)
      }
    }
    init()
    return () => {
      mounted = false
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop())
        unregisterStream(localStreamRef.current)
        localStreamRef.current = null
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }
      if (signalingClientRef.current) {
        signalingClientRef.current.disconnect(false)
        signalingClientRef.current = null
      }
      if (typeof window !== "undefined") {
        localStorage.removeItem("session_id")
      }
      remoteStreamRef.current = null
      setSignalingReady(false)
      setHasJoined(false)
      setLocalStream(null)
      setRemoteStream(null)
      setRemoteVideoMuted(false)
      setRemoteAudioMuted(false)
      setIsConnected(false)
      setIsConnecting(false)
    }
  }, [enabled, sessionId, userId, initLocalStream, createPeerConnection, createOffer, useMock, wsUrl])

  const toggleMute = useCallback(() => {
    const next = !isMutedRef.current
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !next })
    flushSync(() => setIsMuted(next))
  }, [])

  const toggleVideo = useCallback(() => {
    const next = !isVideoEnabledRef.current
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = next })
    const sender = peerConnectionRef.current?.getSenders().find((s) => s.track?.kind === "video")
    if (sender?.track) sender.track.enabled = next
    flushSync(() => setIsVideoEnabled(next))
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current
    }
  }, [localVideoRef])

  const sendVote = useCallback(
    (vote: VoteChoice) => {
      if (sessionId && userId) signalingClientRef.current?.sendVote(sessionId, userId, vote)
    },
    [sessionId, userId]
  )

  const leaveSession = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop())
      unregisterStream(localStreamRef.current)
      localStreamRef.current = null
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    if (signalingClientRef.current) {
      signalingClientRef.current.disconnect()
      signalingClientRef.current = null
    }
    remoteStreamRef.current = null
    setSignalingReady(false)
    setHasJoined(false)
    setLocalStream(null)
    setRemoteStream(null)
    setRemoteVideoMuted(false)
    setRemoteAudioMuted(false)
    setIsConnected(false)
    setIsConnecting(false)
    onDisconnectedRef.current?.()
  }, [])

  const replaceVideoTrack = useCallback((processedStream: MediaStream | null) => {
    const pc = peerConnectionRef.current
    if (!pc) return

    const sender = pc.getSenders().find((s) => s.track?.kind === "video")
    const fallbackTrack = localStreamRef.current?.getVideoTracks()[0] ?? null
    const nextTrack = processedStream?.getVideoTracks()[0] ?? fallbackTrack
    if (!nextTrack) return

    nextTrack.enabled = isVideoEnabledRef.current
    if (sender) {
      sender.replaceTrack(nextTrack).catch((err) => console.error("[WebRTC] replaceTrack failed:", err))
      return
    }

    pc.addTrack(nextTrack, processedStream ?? localStreamRef.current ?? new MediaStream())
  }, [])

  return {
    localStream,
    remoteStream,
    isConnected,
    isConnecting,
    hasJoined,
    error,
    toggleMute,
    isMuted,
    toggleVideo,
    isVideoEnabled,
    remoteVideoMuted,
    remoteAudioMuted,
    sendVote,
    leaveSession,
    replaceVideoTrack,
    signalingClient: signalingClientRef.current,
  }
}
