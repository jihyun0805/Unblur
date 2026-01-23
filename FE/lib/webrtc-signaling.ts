// WebRTC 시그널링 메시지 타입 정의
export type SignalingMessage =
  | { type: "offer"; sdp: RTCSessionDescriptionInit; sessionId: string }
  | { type: "answer"; sdp: RTCSessionDescriptionInit; sessionId: string }
  | { type: "ice-candidate"; candidate: RTCIceCandidateInit; sessionId: string }
  | { type: "error"; message: string; sessionId: string }
  | { type: "join"; sessionId: string }
  | { type: "leave"; sessionId: string }
  | { type: "connected"; sessionId: string }
  | { type: "disconnected"; sessionId: string }

export type SignalingMessageHandler = (message: SignalingMessage) => void

export interface WebRTCSignalingClient {
  connect(sessionId: string): Promise<void>
  disconnect(): void
  sendOffer(sdp: RTCSessionDescriptionInit, sessionId: string): void
  sendAnswer(sdp: RTCSessionDescriptionInit, sessionId: string): void
  sendIceCandidate(candidate: RTCIceCandidateInit, sessionId: string): void
  onMessage(handler: SignalingMessageHandler): () => void
  isConnected(): boolean
}

// WebSocket 기반 시그널링 클라이언트
export class WebSocketSignalingClient implements WebRTCSignalingClient {
  private ws: WebSocket | null = null
  private messageHandlers: Set<SignalingMessageHandler> = new Set()
  private sessionId: string | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private reconnectTimer: NodeJS.Timeout | null = null

  constructor(private wsUrl: string) {}

  async connect(sessionId: string): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN && this.sessionId === sessionId) {
      return
    }

    this.sessionId = sessionId
    this.disconnect()

    return new Promise((resolve, reject) => {
      try {
        const url = `${this.wsUrl}?sessionId=${sessionId}`
        this.ws = new WebSocket(url)

        this.ws.onopen = () => {
          console.log("[WebRTC] WebSocket connected")
          this.reconnectAttempts = 0
          this.send({ type: "join", sessionId })
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: SignalingMessage = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error("[WebRTC] Failed to parse message:", error)
          }
        }

        this.ws.onerror = (error) => {
          console.error("[WebRTC] WebSocket error:", error)
          reject(error)
        }

        this.ws.onclose = () => {
          console.log("[WebRTC] WebSocket closed")
          this.ws = null
          this.attemptReconnect(sessionId)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  private attemptReconnect(sessionId: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[WebRTC] Max reconnect attempts reached")
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    console.log(`[WebRTC] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    this.reconnectTimer = setTimeout(() => {
      this.connect(sessionId).catch((error) => {
        console.error("[WebRTC] Reconnect failed:", error)
      })
    }, delay)
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      if (this.sessionId) {
        this.send({ type: "leave", sessionId: this.sessionId })
      }
      this.ws.close()
      this.ws = null
    }
    this.sessionId = null
    this.reconnectAttempts = 0
  }

  private send(message: SignalingMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn("[WebRTC] Cannot send message, WebSocket not connected")
    }
  }

  sendOffer(sdp: RTCSessionDescriptionInit, sessionId: string): void {
    this.send({ type: "offer", sdp, sessionId })
  }

  sendAnswer(sdp: RTCSessionDescriptionInit, sessionId: string): void {
    this.send({ type: "answer", sdp, sessionId })
  }

  sendIceCandidate(candidate: RTCIceCandidateInit, sessionId: string): void {
    this.send({ type: "ice-candidate", candidate, sessionId })
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

// Mock 시그널링 클라이언트 (백엔드 미구현 시 사용)
export class MockSignalingClient implements WebRTCSignalingClient {
  private messageHandlers: Set<SignalingMessageHandler> = new Set()
  private connected = false

  async connect(sessionId: string): Promise<void> {
    console.log("[WebRTC] Mock signaling client connected (sessionId:", sessionId, ")")
    this.connected = true

    // 시뮬레이션: 연결 성공 메시지
    setTimeout(() => {
      this.handleMessage({ type: "connected", sessionId })
    }, 100)
  }

  disconnect(): void {
    console.log("[WebRTC] Mock signaling client disconnected")
    this.connected = false
  }

  sendOffer(sdp: RTCSessionDescriptionInit, sessionId: string): void {
    console.log("[WebRTC] Mock: Offer sent", { sdp, sessionId })
    // Mock에서는 실제로 전송하지 않음
  }

  sendAnswer(sdp: RTCSessionDescriptionInit, sessionId: string): void {
    console.log("[WebRTC] Mock: Answer sent", { sdp, sessionId })
  }

  sendIceCandidate(candidate: RTCIceCandidateInit, sessionId: string): void {
    console.log("[WebRTC] Mock: ICE candidate sent", { candidate, sessionId })
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
        console.error("[WebRTC] Error in mock message handler:", error)
      }
    })
  }

  isConnected(): boolean {
    return this.connected
  }
}

// 시그널링 클라이언트 팩토리
export function createSignalingClient(wsUrl?: string, useMock = false): WebRTCSignalingClient {
  if (useMock || !wsUrl) {
    return new MockSignalingClient()
  }

  // 환경 변수에서 WebSocket URL 가져오기
  const url = wsUrl || process.env.NEXT_PUBLIC_WS_RTC_URL || "ws://localhost:8080/ws/rtc"
  return new WebSocketSignalingClient(url)
}
