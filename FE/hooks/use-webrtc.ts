"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createSignalingClient, type SignalingMessage, type WebRTCSignalingClient } from "@/lib/webrtc-signaling"
import { registerStream, unregisterStream } from "@/lib/media-streams"

export interface UseWebRTCOptions {
  sessionId: string
  userId: string
  localVideoRef: React.RefObject<HTMLVideoElement | null> | React.MutableRefObject<HTMLVideoElement | null>
  remoteVideoRef: React.RefObject<HTMLVideoElement | null> | React.MutableRefObject<HTMLVideoElement | null>
  enabled?: boolean
  useMock?: boolean
  wsUrl?: string
  onDisconnected?: () => void
}

export interface UseWebRTCReturn {
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  toggleMute: () => void
  isMuted: boolean
  toggleVideo: () => void
  isVideoEnabled: boolean
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
};

export function useWebRTC({
  sessionId,
  userId,
  localVideoRef,
  remoteVideoRef,
  enabled = true,
  useMock = false,
  wsUrl,
  onDisconnected,
}: UseWebRTCOptions): UseWebRTCReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [signalingReady, setSignalingReady] = useState(false)

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const signalingClientRef = useRef<WebRTCSignalingClient | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([])
  const isMutedRef = useRef(isMuted)
  const isVideoEnabledRef = useRef(isVideoEnabled)

  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])
  useEffect(() => {
    isVideoEnabledRef.current = isVideoEnabled
  }, [isVideoEnabled])

  const initLocalStream = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("MediaDevices API를 사용할 수 없습니다")
    }
    let videoStream: MediaStream | null = null
    let audioStream: MediaStream | null = null
    let cameraError: string | null = null
    let micError: string | null = null

    try {
      videoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      })
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
    return combined
  }, [localVideoRef])

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current!))
    }

    pc.ontrack = (event) => {
      const track = event.track
      console.log("[WebRTC] Received remote track", track.kind)
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
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") setError("연결이 끊어졌습니다")
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
                  if (track && !stream!.getTracks().some((t) => t.id === track.id)) stream!.addTrack(track)
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
        case "connected":
          break
        case "error":
          setError(message.message)
          break
        case "disconnected":
          setIsConnected(false)
          setError("상대방과의 연결이 끊어졌습니다")
          signalingClientRef.current?.disconnect()
          signalingClientRef.current = null
          onDisconnected?.()
          break
      }
    }
    const unsub = signalingClientRef.current.onMessage(handleMessage)
    return unsub
  }, [enabled, signalingReady, sessionId, createAnswer, createOffer, onDisconnected, drainPendingIceCandidates])

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
        signalingClientRef.current.disconnect()
        signalingClientRef.current = null
      }
      remoteStreamRef.current = null
      setSignalingReady(false)
      setLocalStream(null)
      setRemoteStream(null)
      setIsConnected(false)
      setIsConnecting(false)
    }
  }, [enabled, sessionId, userId, initLocalStream, createPeerConnection, createOffer, useMock, wsUrl])

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev
      localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !next })
      return next
    })
  }, [])

  const toggleVideo = useCallback(() => {
    setIsVideoEnabled((prev) => {
      const next = !prev
      localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = next })
      return next
    })
  }, [])

  return {
    localStream,
    remoteStream,
    isConnected,
    isConnecting,
    error,
    toggleMute,
    isMuted,
    toggleVideo,
    isVideoEnabled,
  }
}
