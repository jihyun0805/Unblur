import { Client, IMessage, StompSubscription } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import type { ChatMessageResponseDto, ChatReadEventDto } from "@/lib/chat-types"

// SockJS는 http:// 또는 https://를 사용해야 함 (ws://는 사용 불가)
const getWebSocketUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_WS_CHAT_URL || "http://localhost:8080/ws"
  if (url.startsWith("ws://")) return url.replace("ws://", "http://")
  if (url.startsWith("wss://")) return url.replace("wss://", "https://")
  return url
}

const WS_BASE_URL = getWebSocketUrl()

/** STOMP 구독 토픽 prefix (conferenceId 붙여서 사용) */
const CHAT_TOPIC_PREFIX = "/sub/conferences/"

/** 채팅 메시지 DTO 타입 가드 */
function isChatMessageResponseDto(
  data: unknown
): data is ChatMessageResponseDto {
  return (
    typeof data === "object" &&
    data !== null &&
    "messageId" in data &&
    typeof (data as ChatMessageResponseDto).messageId === "string"
  )
}

/** 읽음 이벤트 DTO 타입 가드 */
function isChatReadEventDto(data: unknown): data is ChatReadEventDto {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    (data as ChatReadEventDto).type === "SYSTEM" &&
    "readerId" in data &&
    typeof (data as ChatReadEventDto).readerId === "string"
  )
}

/**
 * WebSocket 메시지 핸들러 타입
 */
export type ChatMessageHandler = (message: ChatMessageResponseDto) => void
export type ChatReadEventHandler = (event: ChatReadEventDto) => void

/**
 * WebSocket 연결 상태
 */
export type WebSocketConnectionState = "disconnected" | "connecting" | "connected" | "error"

/**
 * 채팅 WebSocket 싱글톤 서비스
 * 
 * React WebSocket 베스트 프랙티스:
 * - 싱글톤 패턴으로 단일 연결 인스턴스 관리
 * - 여러 컴포넌트에서 같은 연결 재사용
 * - 구독 카운터로 관리 (여러 컴포넌트가 구독 중이면 실제 구독 유지)
 */
export class ChatWebSocketService {
  private static instance: ChatWebSocketService | null = null
  private client: Client | null = null
  private subscriptions: Map<string, StompSubscription> = new Map()
  private subscriptionCounters: Map<string, number> = new Map() // conferenceId별 구독 카운터
  private messageHandlers: Map<string, Set<ChatMessageHandler>> = new Map()
  private readEventHandlers: Map<string, Set<ChatReadEventHandler>> = new Map()
  private connectionState: WebSocketConnectionState = "disconnected"
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000 // 1초부터 시작
  private connectionStateListeners: Set<(state: WebSocketConnectionState) => void> = new Set()

  private constructor() {
    // 싱글톤이므로 private 생성자
  }

  /**
   * 싱글톤 인스턴스 가져오기
   */
  static getInstance(): ChatWebSocketService {
    if (!ChatWebSocketService.instance) {
      ChatWebSocketService.instance = new ChatWebSocketService()
    }
    return ChatWebSocketService.instance
  }

  /**
   * 연결 상태 가져오기
   */
  getConnectionState(): WebSocketConnectionState {
    return this.connectionState
  }

  /**
   * 연결 상태 리스너 등록
   */
  onConnectionStateChange(listener: (state: WebSocketConnectionState) => void): () => void {
    this.connectionStateListeners.add(listener)
    // cleanup 함수 반환
    return () => {
      this.connectionStateListeners.delete(listener)
    }
  }

  /**
   * 연결 상태 업데이트 및 리스너에 알림
   */
  private setConnectionState(state: WebSocketConnectionState) {
    this.connectionState = state
    this.connectionStateListeners.forEach((listener) => listener(state))
  }

  /**
   * WebSocket 연결
   */
  async connect(): Promise<void> {
    if (this.client?.active) {
      return // 이미 연결되어 있음
    }

    return new Promise((resolve, reject) => {
      try {
        this.setConnectionState("connecting")

        const socket = new SockJS(WS_BASE_URL)
        this.client = new Client({
          webSocketFactory: () => socket as any,
          reconnectDelay: 0, // 수동 재연결 관리
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
          debug: () => {},
        })

        this.client.onConnect = () => {
          console.log("[ChatWebSocket] Connected")
          this.setConnectionState("connected")
          this.reconnectAttempts = 0
          this.reconnectDelay = 1000

          // 기존 구독 복원
          this.restoreSubscriptions()

          resolve()
        }

        this.client.onStompError = (frame) => {
          console.error("[ChatWebSocket] STOMP error:", frame)
          this.setConnectionState("error")
          reject(new Error(frame.headers["message"] || "STOMP 연결 오류"))
        }

        this.client.onWebSocketError = (event) => {
          console.error("[ChatWebSocket] WebSocket error:", event)
          this.setConnectionState("error")
          reject(new Error("WebSocket 연결 오류"))
        }

        this.client.onDisconnect = () => {
          console.log("[ChatWebSocket] Disconnected")
          this.setConnectionState("disconnected")
          this.subscriptions.clear()

          // 자동 재연결 시도
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect()
          }
        }

        this.client.activate()
      } catch (error) {
        this.setConnectionState("error")
        reject(error)
      }
    })
  }

  /**
   * 재연결 시도 (지수 백오프)
   */
  private attemptReconnect() {
    this.reconnectAttempts++
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000) // 최대 30초

    console.log(`[ChatWebSocket] 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts} (${delay}ms 후)`)

    setTimeout(() => {
      if (!this.client?.active && this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.connect().catch((error) => {
          console.error("[ChatWebSocket] 재연결 실패:", error)
        })
      }
    }, delay)
  }

  /**
   * 기존 구독 복원 (재연결 후)
   */
  private restoreSubscriptions() {
    // 구독 카운터가 있는 모든 conferenceId에 대해 구독 복원
    this.subscriptionCounters.forEach((count, conferenceId) => {
      if (count > 0) {
        this.subscribeInternal(conferenceId)
      }
    })
  }

  /**
   * 내부 구독 로직 (STOMP 연결이 완료된 경우에만 호출)
   */
  private subscribeInternal(conferenceId: string) {
    if (this.connectionState !== "connected" || !this.client) {
      console.warn("[ChatWebSocket] STOMP 연결이 완료되지 않았습니다")
      return
    }

    const topic = `${CHAT_TOPIC_PREFIX}${conferenceId}`

    // 이미 구독 중이면 스킵
    if (this.subscriptions.has(conferenceId)) {
      return
    }

    try {
      const subscription = this.client.subscribe(topic, (message: IMessage) => {
        try {
          if (!message.body) {
            console.warn("[ChatWebSocket] 메시지 본문이 비어있습니다")
            return
          }

          const data: unknown = JSON.parse(message.body)

          if (isChatMessageResponseDto(data)) {
            const handlers = this.messageHandlers.get(conferenceId)
            if (handlers?.size) {
              handlers.forEach((handler) => handler(data))
            } else {
              console.warn("[ChatWebSocket] 메시지 핸들러가 등록되지 않았습니다:", conferenceId)
            }
          } else if (isChatReadEventDto(data)) {
            const handlers = this.readEventHandlers.get(conferenceId)
            if (handlers?.size) {
              handlers.forEach((handler) => handler(data))
            }
          } else {
            console.warn("[ChatWebSocket] 알 수 없는 메시지 타입:", data)
          }
        } catch (error) {
          console.error("[ChatWebSocket] 메시지 파싱 오류:", error, {
            body: message.body,
            headers: message.headers,
          })
        }
      })

      this.subscriptions.set(conferenceId, subscription)
      console.log(`[ChatWebSocket] 구독 완료: ${topic}`)
    } catch (error) {
      console.error(`[ChatWebSocket] 구독 실패: ${topic}`, error)
    }
  }

  /**
   * 특정 컨퍼런스의 메시지 구독
   * @param conferenceId 컨퍼런스 ID
   * @param onMessage 메시지 핸들러
   * @param onReadEvent 읽음 이벤트 핸들러 (선택)
   * @returns 구독 해제 함수
   */
  subscribe(
    conferenceId: string,
    onMessage: ChatMessageHandler,
    onReadEvent?: ChatReadEventHandler
  ): () => void {
    // 구독 카운터 증가
    const currentCount = this.subscriptionCounters.get(conferenceId) || 0
    this.subscriptionCounters.set(conferenceId, currentCount + 1)

    // 핸들러 등록
    if (!this.messageHandlers.has(conferenceId)) {
      this.messageHandlers.set(conferenceId, new Set())
    }
    this.messageHandlers.get(conferenceId)!.add(onMessage)

    if (onReadEvent) {
      if (!this.readEventHandlers.has(conferenceId)) {
        this.readEventHandlers.set(conferenceId, new Set())
      }
      this.readEventHandlers.get(conferenceId)!.add(onReadEvent)
    }

    // 연결이 완료된 경우에만 구독. 아니면 연결 후 구독.
    if (this.connectionState === "connected") {
      this.subscribeInternal(conferenceId)
    } else {
      this.connect()
        .then(() => this.subscribeInternal(conferenceId))
        .catch((error) => {
          console.error("[ChatWebSocket] 연결 실패:", error)
        })
    }

    // 구독 해제 함수 반환
    return () => {
      this.unsubscribe(conferenceId, onMessage, onReadEvent)
    }
  }

  /**
   * 구독 해제
   * @param conferenceId 컨퍼런스 ID
   * @param onMessage 메시지 핸들러
   * @param onReadEvent 읽음 이벤트 핸들러 (선택)
   */
  unsubscribe(
    conferenceId: string,
    onMessage: ChatMessageHandler,
    onReadEvent?: ChatReadEventHandler
  ): void {
    // 핸들러 제거
    const messageHandlers = this.messageHandlers.get(conferenceId)
    if (messageHandlers) {
      messageHandlers.delete(onMessage)
      if (messageHandlers.size === 0) {
        this.messageHandlers.delete(conferenceId)
      }
    }

    if (onReadEvent) {
      const readEventHandlers = this.readEventHandlers.get(conferenceId)
      if (readEventHandlers) {
        readEventHandlers.delete(onReadEvent)
        if (readEventHandlers.size === 0) {
          this.readEventHandlers.delete(conferenceId)
        }
      }
    }

    // 구독 카운터 감소
    const currentCount = this.subscriptionCounters.get(conferenceId) || 0
    const newCount = Math.max(0, currentCount - 1)
    this.subscriptionCounters.set(conferenceId, newCount)

    // 카운터가 0이 되면 실제 구독 해제
    if (newCount === 0) {
      const subscription = this.subscriptions.get(conferenceId)
      if (subscription) {
        subscription.unsubscribe()
        this.subscriptions.delete(conferenceId)
        console.log(`[ChatWebSocket] 구독 해제: ${CHAT_TOPIC_PREFIX}${conferenceId}`)
      }
    }
  }

  /**
   * WebSocket 연결 해제
   * 주의: 모든 구독이 해제된 후에만 호출해야 함
   */
  disconnect(): void {
    if (this.client) {
      // 모든 구독 해제
      this.subscriptions.forEach((subscription) => {
        subscription.unsubscribe()
      })
      this.subscriptions.clear()
      this.subscriptionCounters.clear()
      this.messageHandlers.clear()
      this.readEventHandlers.clear()

      // 연결 해제
      if (this.client.active) {
        this.client.deactivate()
      }
      this.client = null
      this.setConnectionState("disconnected")
      console.log("[ChatWebSocket] 연결 해제 완료")
    }
  }
}
