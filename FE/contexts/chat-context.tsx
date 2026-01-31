"use client"

import { createContext, useContext, useState, useRef, useEffect, useCallback, useMemo, type ReactNode } from "react"
import {
  ChatWebSocketService,
  type WebSocketConnectionState,
  type ChatMessageHandler,
  type ChatReadEventHandler,
} from "@/lib/chat-websocket"

interface ChatContextType {
  /**
   * WebSocket 서비스 인스턴스
   */
  wsService: ChatWebSocketService

  /**
   * 연결 상태
   */
  connectionState: WebSocketConnectionState

  /**
   * 컨퍼런스 메시지 구독
   * @param conferenceId 컨퍼런스 ID
   * @param onMessage 메시지 핸들러
   * @param onReadEvent 읽음 이벤트 핸들러 (선택)
   * @returns 구독 해제 함수
   */
  subscribe: (
    conferenceId: string,
    onMessage: ChatMessageHandler,
    onReadEvent?: ChatReadEventHandler
  ) => () => void

  /**
   * 구독 해제
   */
  unsubscribe: (
    conferenceId: string,
    onMessage: ChatMessageHandler,
    onReadEvent?: ChatReadEventHandler
  ) => void

  /**
   * 연결 상태 변경 리스너 등록
   */
  onConnectionStateChange: (listener: (state: WebSocketConnectionState) => void) => () => void
}

const ChatContext = createContext<ChatContextType | null>(null)

/**
 * Chat Provider
 * WebSocket 싱글톤 서비스를 Context로 제공
 */
export function ChatProvider({ children }: { children: ReactNode }) {
  // 싱글톤 인스턴스를 즉시 초기화 (useEffect 전에)
  const wsServiceRef = useRef<ChatWebSocketService>(
    ChatWebSocketService.getInstance()
  )
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>(
    () => wsServiceRef.current.getConnectionState()
  )

  // 연결 상태 리스너 등록
  useEffect(() => {
    const cleanup = wsServiceRef.current.onConnectionStateChange((state) => {
      setConnectionState(state)
    })

    // 초기 연결 상태 설정
    setConnectionState(wsServiceRef.current.getConnectionState())

    return cleanup
  }, [])

  // 참조가 바뀌지 않도록 useCallback으로 안정화 → useChat 등에서 effect 의존성으로 쓸 때 불필요한 재구독 방지
  const subscribe = useCallback(
    (
      conferenceId: string,
      onMessage: ChatMessageHandler,
      onReadEvent?: ChatReadEventHandler
    ): (() => void) => {
      return wsServiceRef.current.subscribe(conferenceId, onMessage, onReadEvent)
    },
    []
  )

  const unsubscribe = useCallback(
    (
      conferenceId: string,
      onMessage: ChatMessageHandler,
      onReadEvent?: ChatReadEventHandler
    ): void => {
      wsServiceRef.current.unsubscribe(conferenceId, onMessage, onReadEvent)
    },
    []
  )

  const onConnectionStateChange = useCallback(
    (listener: (state: WebSocketConnectionState) => void): (() => void) => {
      return wsServiceRef.current.onConnectionStateChange(listener)
    },
    []
  )

  const value = useMemo(
    () => ({
      wsService: wsServiceRef.current,
      connectionState,
      subscribe,
      unsubscribe,
      onConnectionStateChange,
    }),
    [connectionState, subscribe, unsubscribe, onConnectionStateChange]
  )

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}

/**
 * Chat Context 훅
 */
export function useChatContext(): ChatContextType {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider")
  }
  return context
}
