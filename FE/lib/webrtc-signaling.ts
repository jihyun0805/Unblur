// WebRTC 시그널링 메시지 타입 (BE Kurento 프로토콜에 맞춤)
export type SignalingMessage =
  | { type: "offer"; sdp: RTCSessionDescriptionInit; sessionId: string }
  | { type: "answer"; sdp: RTCSessionDescriptionInit; sessionId: string }
  | { type: "ice-candidate"; candidate: RTCIceCandidateInit; sessionId: string }
  | { type: "error"; message: string; sessionId: string }
  | { type: "joined"; conferenceId: string; userId: string; sessionId: string }
  | { type: "connected"; sessionId: string }
  | { type: "disconnected"; sessionId: string }

export type SignalingMessageHandler = (message: SignalingMessage) => void

export interface WebRTCSignalingClient {
  connect(conferenceId: string, userId: string): Promise<void>
  disconnect(): void
  sendOffer(sdp: RTCSessionDescriptionInit, conferenceId: string, userId: string): void
  sendAnswer(sdp: RTCSessionDescriptionInit, conferenceId: string, userId: string): void
  sendIceCandidate(candidate: RTCIceCandidateInit, conferenceId: string, userId: string): void
  onMessage(handler: SignalingMessageHandler): () => void
  isConnected(): boolean
}

// BE RTC 서버 원시 메시지
interface ServerMessage {
  type: string
  userId?: string
  conferenceId?: string
  sdpAnswer?: string
  candidate?: { candidate: string; sdpMid: string; sdpMLineIndex: number }
  message?: string
}

function normalizeWsUrl(input: string): string {
  const trimmed = input.trim()
  if (trimmed.startsWith("ws://") || trimmed.startsWith("wss://")) return trimmed
  if (trimmed.startsWith("https://")) return trimmed.replace("https://", "wss://")
  if (trimmed.startsWith("http://")) return trimmed.replace("http://", "ws://")
  return `ws://${trimmed}`
}

export class WebSocketSignalingClient implements WebRTCSignalingClient {
  private ws: WebSocket | null = null
  private messageHandlers: Set<SignalingMessageHandler> = new Set()
  private conferenceId: string | null = null
  private userId: string | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private skipReconnect = false

  constructor(private wsUrl: string) {}

  async connect(conferenceId: string, userId: string): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN && this.conferenceId === conferenceId && this.userId === userId) {
      return
    }

    this.disconnect()
    this.conferenceId = conferenceId
    this.userId = userId

    return new Promise((resolve, reject) => {
      try {
        const url = `${normalizeWsUrl(this.wsUrl)}?sessionId=${encodeURIComponent(conferenceId)}`
        this.ws = new WebSocket(url)

        const maxJoinRetries = 3
        const joinRetryDelayMs = 2000
        let joinRetryCount = 0
        let joinRetryTimer: ReturnType<typeof setTimeout> | null = null

        const sendJoin = () => {
          if (this.ws?.readyState !== WebSocket.OPEN || !this.conferenceId || !this.userId) return
          this.send({ type: "join", conferenceId: this.conferenceId, userId: this.userId })
        }

        const clearJoinRetry = () => {
          if (joinRetryTimer != null) {
            clearTimeout(joinRetryTimer)
            joinRetryTimer = null
          }
        }

        const handleJoined = () => {
          clearJoinRetry()
          this.ws?.removeEventListener?.("message", onMessage)
          resolve()
        }

        const onMessage = (event: MessageEvent) => {
          try {
            const raw: ServerMessage = JSON.parse(event.data)
            if (raw.type === "joined") handleJoined()
            if (raw.type === "error" && process.env.NODE_ENV === "development") {
              console.warn("[WebRTC] Server error:", raw.message)
            }
          } catch {
            /* ignore */
          }
        }

        const scheduleJoinRetry = () => {
          if (joinRetryCount >= maxJoinRetries) return
          joinRetryTimer = setTimeout(() => {
            joinRetryCount++
            sendJoin()
            scheduleJoinRetry()
          }, joinRetryDelayMs)
        }

        this.ws.addEventListener("message", onMessage)

        this.ws.onopen = () => {
          console.log("[WebRTC] WebSocket connected")
          this.skipReconnect = false
          this.reconnectAttempts = 0
          sendJoin()
          scheduleJoinRetry()
        }

        this.ws.onmessage = (event) => {
          try {
            const raw: ServerMessage = JSON.parse(event.data)
            const normalized = this.normalizeServerMessage(raw)
            if (normalized) this.handleMessage(normalized)
          } catch (error) {
            console.error("[WebRTC] Failed to parse message:", error)
          }
        }

        this.ws.onerror = (error) => {
          console.error("[WebRTC] WebSocket error:", error)
          reject(error)
        }

        this.ws.onclose = () => {
          clearJoinRetry()
          console.log("[WebRTC] WebSocket closed")
          this.ws = null
          if (!this.skipReconnect) this.attemptReconnect(conferenceId, userId)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  private normalizeServerMessage(raw: ServerMessage): SignalingMessage | null {
    const sessionId = this.conferenceId ?? ""
    if (raw.type === "joined") {
      return { type: "joined", conferenceId: raw.conferenceId ?? "", userId: raw.userId ?? "", sessionId }
    }
    if (raw.type === "answer" && raw.sdpAnswer != null) {
      return { type: "answer", sdp: { type: "answer", sdp: raw.sdpAnswer }, sessionId }
    }
    if (raw.type === "candidate" && raw.candidate) {
      return { type: "ice-candidate", candidate: raw.candidate as RTCIceCandidateInit, sessionId }
    }
    if (raw.type === "error") {
      return { type: "error", message: raw.message ?? "Unknown error", sessionId }
    }
    if (raw.type === "left") {
      return { type: "disconnected", sessionId }
    }
    return null
  }

  private attemptReconnect(conferenceId: string, userId: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    this.reconnectTimer = setTimeout(() => {
      this.connect(conferenceId, userId).catch((err) => console.error("[WebRTC] Reconnect failed:", err))
    }, delay)
  }

  disconnect(): void {
    this.skipReconnect = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws?.readyState === WebSocket.OPEN && this.conferenceId && this.userId) {
      this.send({ type: "leave", conferenceId: this.conferenceId, userId: this.userId })
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.conferenceId = null
    this.userId = null
    this.reconnectAttempts = 0
  }

  private send(message: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn("[WebRTC] Cannot send message, WebSocket not connected")
    }
  }

  sendOffer(sdp: RTCSessionDescriptionInit, conferenceId: string, userId: string): void {
    this.send({ type: "offer", conferenceId, userId, sdpOffer: sdp.sdp })
  }

  sendAnswer(sdp: RTCSessionDescriptionInit, conferenceId: string, userId: string): void {
    this.send({ type: "answer", conferenceId, userId, sdpAnswer: sdp.sdp })
  }

  sendIceCandidate(candidate: RTCIceCandidateInit, conferenceId: string, userId: string): void {
    this.send({
      type: "candidate",
      conferenceId,
      userId,
      candidate: {
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid ?? undefined,
        sdpMLineIndex: candidate.sdpMLineIndex ?? 0,
      },
    })
  }

  onMessage(handler: SignalingMessageHandler): () => void {
    this.messageHandlers.add(handler)
    return () => {
      this.messageHandlers.delete(handler)
    }
  }

  private handleMessage(message: SignalingMessage): void {
    this.messageHandlers.forEach((handler) => {
      try {
        handler(message)
      } catch (error) {
        console.error("[WebRTC] Error in message handler:", error)
      }
    })
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export class MockSignalingClient implements WebRTCSignalingClient {
  private messageHandlers: Set<SignalingMessageHandler> = new Set()
  private connected = false
  private mockConferenceId: string | null = null
  private mockUserId: string | null = null

  async connect(conferenceId: string, userId: string): Promise<void> {
    console.log("[WebRTC] Mock signaling connected", { conferenceId, userId })
    this.connected = true
    this.mockConferenceId = conferenceId
    this.mockUserId = userId
    setTimeout(() => {
      this.handleMessage({ type: "connected", sessionId: conferenceId })
    }, 100)
    return Promise.resolve()
  }

  disconnect(): void {
    this.connected = false
    this.mockConferenceId = null
    this.mockUserId = null
  }

  sendOffer(sdp: RTCSessionDescriptionInit, conferenceId: string, userId: string): void {
    console.log("[WebRTC] Mock: Offer sent", { conferenceId, userId })
  }

  sendAnswer(sdp: RTCSessionDescriptionInit, conferenceId: string, userId: string): void {
    console.log("[WebRTC] Mock: Answer sent", { conferenceId, userId })
  }

  sendIceCandidate(candidate: RTCIceCandidateInit, conferenceId: string, userId: string): void {
    console.log("[WebRTC] Mock: ICE candidate sent", { conferenceId, userId })
  }

  onMessage(handler: SignalingMessageHandler): () => void {
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  private handleMessage(message: SignalingMessage): void {
    this.messageHandlers.forEach((h) => {
      try {
        h(message)
      } catch (e) {
        console.error("[WebRTC] Mock handler error:", e)
      }
    })
  }

  isConnected(): boolean {
    return this.connected
  }
}

export function createSignalingClient(wsUrl?: string, useMock = false): WebRTCSignalingClient {
  if (useMock) return new MockSignalingClient()
  const raw = wsUrl ?? process.env.NEXT_PUBLIC_WS_RTC_URL ?? "http://localhost:8080/ws/rtc"
  return new WebSocketSignalingClient(normalizeWsUrl(raw))
}
