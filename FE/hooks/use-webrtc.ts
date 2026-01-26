"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createSignalingClient, type SignalingMessage, type WebRTCSignalingClient } from "@/lib/webrtc-signaling"

export interface UseWebRTCOptions {
  sessionId: string
  localVideoRef: React.RefObject<HTMLVideoElement | null> | React.MutableRefObject<HTMLVideoElement | null>
  remoteVideoRef: React.RefObject<HTMLVideoElement | null> | React.MutableRefObject<HTMLVideoElement | null>
  enabled?: boolean
  useMock?: boolean
  wsUrl?: string
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

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // TURN 서버는 백엔드에서 제공받을 수 있음
    // { urls: "turn:localhost:3478", username: "user", credential: "pass" },
  ],
}

export function useWebRTC({
  sessionId,
  localVideoRef,
  remoteVideoRef,
  enabled = true,
  useMock = false,
  wsUrl,
}: UseWebRTCOptions): UseWebRTCReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const signalingClientRef = useRef<WebRTCSignalingClient | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  // 로컬 스트림 초기화
  const initLocalStream = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("MediaDevices API를 사용할 수 없습니다")
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: true,
      })

      localStreamRef.current = stream
      setLocalStream(stream)

      // 로컬 비디오 요소에 스트림 연결
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // 오디오 트랙 mute 상태 적용
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted
      })

      // 비디오 트랙 enabled 상태 적용
      stream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoEnabled
      })

      return stream
    } catch (err: any) {
      console.error("[WebRTC] Failed to get user media:", err)
      let errorMessage = "카메라/마이크에 접근할 수 없습니다"
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage = "카메라/마이크 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요."
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMessage = "카메라/마이크를 찾을 수 없습니다. 장치가 연결되어 있는지 확인해주세요."
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errorMessage = "카메라/마이크에 접근할 수 없습니다. 다른 애플리케이션에서 사용 중일 수 있습니다."
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      throw err
    }
  }, [localVideoRef, isMuted, isVideoEnabled])

  // PeerConnection 생성
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS)

    // 로컬 스트림의 트랙을 추가
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!)
      })
    }

    // 원격 스트림 처리
    pc.ontrack = (event) => {
      console.log("[WebRTC] Received remote track")
      const [remoteStream] = event.streams
      setRemoteStream(remoteStream)

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream
      }
    }

    // ICE candidate 처리
    pc.onicecandidate = (event) => {
      if (event.candidate && signalingClientRef.current) {
        console.log("[WebRTC] Sending ICE candidate")
        signalingClientRef.current.sendIceCandidate(
          {
            candidate: event.candidate.candidate,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            sdpMid: event.candidate.sdpMid,
          },
          sessionId
        )
      }
    }

    // 연결 상태 변경
    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] Connection state:", pc.connectionState)
      setIsConnected(pc.connectionState === "connected")
      setIsConnecting(pc.connectionState === "connecting")

      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setError("연결이 끊어졌습니다")
      }
    }

    // ICE 연결 상태 변경
    pc.oniceconnectionstatechange = () => {
      console.log("[WebRTC] ICE connection state:", pc.iceConnectionState)
      if (pc.iceConnectionState === "failed") {
        console.warn("[WebRTC] ICE connection failed, attempting restart...")
        pc.restartIce()
      }
    }

    return pc
  }, [sessionId, remoteVideoRef])

  // Offer 생성 및 전송
  const createOffer = useCallback(async () => {
    if (!peerConnectionRef.current || !signalingClientRef.current) return

    try {
      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })

      await peerConnectionRef.current.setLocalDescription(offer)
      signalingClientRef.current.sendOffer(offer, sessionId)
      console.log("[WebRTC] Offer created and sent")
    } catch (err) {
      console.error("[WebRTC] Failed to create offer:", err)
      setError("연결 설정에 실패했습니다")
    }
  }, [sessionId])

  // Answer 생성 및 전송
  const createAnswer = useCallback(
    async (offer: RTCSessionDescriptionInit) => {
      if (!peerConnectionRef.current || !signalingClientRef.current) return

      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await peerConnectionRef.current.createAnswer()
        await peerConnectionRef.current.setLocalDescription(answer)
        signalingClientRef.current.sendAnswer(answer, sessionId)
        console.log("[WebRTC] Answer created and sent")
      } catch (err) {
        console.error("[WebRTC] Failed to create answer:", err)
        setError("연결 설정에 실패했습니다")
      }
    },
    [sessionId]
  )

  // 시그널링 메시지 처리
  useEffect(() => {
    if (!enabled || !signalingClientRef.current) return

    const handleMessage = (message: SignalingMessage) => {
      if (message.sessionId !== sessionId) return

      switch (message.type) {
        case "offer":
          createAnswer(message.sdp)
          break

        case "answer":
          if (peerConnectionRef.current) {
            peerConnectionRef.current
              .setRemoteDescription(new RTCSessionDescription(message.sdp))
              .catch((err) => {
                console.error("[WebRTC] Failed to set remote description:", err)
              })
          }
          break

        case "ice-candidate":
          if (peerConnectionRef.current && message.candidate) {
            peerConnectionRef.current
              .addIceCandidate(new RTCIceCandidate(message.candidate))
              .catch((err) => {
                console.error("[WebRTC] Failed to add ICE candidate:", err)
              })
          }
          break

        case "connected":
          console.log("[WebRTC] Signaling connected")
          // 연결되면 Offer 생성
          setTimeout(() => {
            createOffer()
          }, 500)
          break

        case "error":
          setError(message.message)
          break

        case "disconnected":
          setIsConnected(false)
          setError("상대방과의 연결이 끊어졌습니다")
          break
      }
    }

    const unsubscribe = signalingClientRef.current.onMessage(handleMessage)
    return unsubscribe
  }, [enabled, sessionId, createAnswer, createOffer])

  // WebRTC 초기화
  useEffect(() => {
    if (!enabled) return

    let mounted = true

    const init = async () => {
      try {
        setIsConnecting(true)
        setError(null)

        // 로컬 스트림 초기화
        await initLocalStream()

        // 시그널링 클라이언트 생성 및 연결
        const client = createSignalingClient(wsUrl, useMock)
        signalingClientRef.current = client
        await client.connect(sessionId)

        // PeerConnection 생성
        const pc = createPeerConnection()
        peerConnectionRef.current = pc

        if (!mounted) {
          pc.close()
          client.disconnect()
          return
        }
      } catch (err: any) {
        console.error("[WebRTC] Initialization failed:", err)
        setError(err.message || "WebRTC 초기화에 실패했습니다")
        setIsConnecting(false)
      }
    }

    init()

    return () => {
      mounted = false

      // 정리
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
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

      setLocalStream(null)
      setRemoteStream(null)
      setIsConnected(false)
      setIsConnecting(false)
    }
  }, [enabled, sessionId, initLocalStream, createPeerConnection, useMock, wsUrl])

  // Mute 토글
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !newMuted
        })
      }
      return newMuted
    })
  }, [])

  // 비디오 토글
  const toggleVideo = useCallback(() => {
    setIsVideoEnabled((prev) => {
      const newEnabled = !prev
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = newEnabled
        })
      }
      return newEnabled
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
