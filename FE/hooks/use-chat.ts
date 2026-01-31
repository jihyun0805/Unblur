"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useChatContext } from "@/contexts/chat-context"
import { useAuth } from "@/contexts/auth-context"
import * as chatApi from "@/lib/api/chat"
import type { ChatMessage, ChatMessageResponseDto, ChatReadEventDto } from "@/lib/chat-types"

interface UseChatOptions {
  conferenceId: string
  enabled?: boolean // WebSocket 구독 활성화 여부
  autoLoadMessages?: boolean // 자동으로 메시지 로드 여부
  pageSize?: number // 페이지 크기
  /** 채팅 패널이 열려 있으면 true. 열린 상태에서 상대 메시지 수신 시 즉시 읽음 처리 */
  panelOpen?: boolean
}

interface UseChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  isSending: boolean
  error: string | null
  hasMore: boolean
  currentPage: number
  /** 읽지 않은 메시지 개수 (상대가 보낸 메시지 중 아직 읽지 않은 것) */
  unreadCount: number
  sendMessage: (content: string) => Promise<void>
  loadMoreMessages: () => Promise<void>
  markAsRead: () => Promise<void>
  refreshMessages: () => Promise<void>
}

/**
 * 채팅 기능 훅
 * 
 * React WebSocket 베스트 프랙티스:
 * - useEffect cleanup으로 구독 해제 (연결은 유지)
 * - 의존성 배열 최적화 (ref 사용)
 * - 메모리 누수 방지
 */
export function useChat({
  conferenceId,
  enabled = true,
  autoLoadMessages = true,
  pageSize = 100,
  panelOpen = false,
}: UseChatOptions): UseChatReturn {
  const { subscribe, unsubscribe, connectionState } = useChatContext()
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  /** 마지막으로 읽은 시각 (미확인 배지용, 패널 닫혀 있어도 유지) */
  const [lastReadAt, setLastReadAt] = useState<Date | null>(null)

  const readDebounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastReadAtRef = useRef<Date | null>(null)
  const isLoadingRef = useRef(false)

  // 메시지 핸들러 ref (의존성 배열 최적화)
  const messageHandlerRef = useRef<((message: ChatMessageResponseDto) => void) | null>(null)
  const readEventHandlerRef = useRef<((event: ChatReadEventDto) => void) | null>(null)
  const messagesRef = useRef<ChatMessage[]>(messages)
  messagesRef.current = messages

  /**
   * DTO를 내부 메시지 타입으로 변환
   */
  const convertToChatMessage = useCallback(
    (dto: ChatMessageResponseDto): ChatMessage => {
      // senderId와 user.id를 안전하게 비교 (둘 다 null이 아닌 경우에만 비교)
      const userId = user?.id
      const senderId = dto.senderId
      const isMine = 
        userId != null && 
        senderId != null && 
        String(senderId).trim() === String(userId).trim()

      return {
        id: dto.messageId,
        senderId: dto.senderId,
        senderNickname: dto.senderNickname,
        type: dto.type === "SYSTEM" ? "SYSTEM" : "USER",
        content: dto.content,
        createdAt: new Date(dto.createdAt),
        isReadByPartner: dto.isReadByPartner,
        isMine,
      }
    },
    [user]
  )

  /**
   * 메시지 수신 핸들러
   */
  const markAsReadRef = useRef<() => Promise<void>>(null as any)

  const handleMessage = useCallback(
    (dto: ChatMessageResponseDto) => {
      const message = convertToChatMessage(dto)
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === message.id)
        if (exists) return prev
        const newMessages = [...prev, message].sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        )
        return newMessages
      })
      // 패널이 열려 있을 때 상대 메시지 수신 시 즉시 읽음 처리 (카카오톡처럼)
      if (panelOpen && !message.isMine) {
        markAsReadRef.current?.()
      }
    },
    [convertToChatMessage, panelOpen]
  )

  /**
   * 읽음 이벤트 핸들러
   * 상대방이 읽음 이벤트를 보냈을 때 = 상대가 채팅창을 읽었다는 의미이므로,
   * 해당 시점까지의 내 메시지는 모두 읽음으로 처리한다.
   * lastReadAt과 createdAt 비교 시 타임존/서버 시각 차이로 누락되는 것을 막기 위해,
   * 상대방 읽음 이벤트 수신 시에는 내 메시지 전부를 읽음으로 갱신한다.
   */
  const handleReadEvent = useCallback((event: ChatReadEventDto) => {
    if (event.readerId === user?.id) return
    setMessages((prev) =>
      prev.map((msg) =>
        msg.isMine ? { ...msg, isReadByPartner: true } : msg
      )
    )
  }, [user])

  /**
   * 메시지 목록 로드
   */
  const loadMessages = useCallback(
    async (page: number = 0, append: boolean = false) => {
      if (isLoadingRef.current) return

      try {
        isLoadingRef.current = true
        setIsLoading(true)
        setError(null)

        const response = await chatApi.getChatMessages(conferenceId, page, pageSize)
        const newMessages = response.items.map(convertToChatMessage)

        setMessages((prev) => {
          if (append) {
            // 기존 메시지와 병합 (중복 제거)
            const existingIds = new Set(prev.map((m) => m.id))
            const uniqueNewMessages = newMessages.filter((m) => !existingIds.has(m.id))
            return [...uniqueNewMessages, ...prev].sort(
              (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
            )
          } else {
            // 새로 교체
            return newMessages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          }
        })

        setCurrentPage(page)
        setHasMore(page < response.totalPages - 1)
      } catch (err: any) {
        console.error("메시지 로드 실패:", err)
        
        // AUTH_FORBIDDEN 오류인 경우 (세션이 없거나 권한이 없는 경우)
        // 빈 메시지 목록으로 처리 (테스트 환경에서 임의의 UUID 사용 시)
        if (err.message === "AUTH_FORBIDDEN" || err.message?.includes("AUTH_FORBIDDEN")) {
          console.warn(`[Chat] 세션(${conferenceId})에 접근할 수 없습니다. 빈 메시지 목록으로 표시합니다. (테스트 환경에서는 정상 동작)`)
          setMessages([])
          setError(null) // 에러를 표시하지 않고 빈 목록으로 처리
          setHasMore(false) // 더 이상 로드할 메시지 없음
        } else {
          setError(err.message || "메시지를 불러오는데 실패했습니다")
        }
      } finally {
        isLoadingRef.current = false
        setIsLoading(false)
      }
    },
    [conferenceId, pageSize, convertToChatMessage]
  )

  /**
   * 더 많은 메시지 로드 (이전 페이지)
   */
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || isLoading) return
    await loadMessages(currentPage + 1, true)
  }, [hasMore, isLoading, currentPage, loadMessages])

  /**
   * 메시지 새로고침
   */
  const refreshMessages = useCallback(async () => {
    await loadMessages(0, false)
  }, [loadMessages])

  /**
   * 메시지 전송
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isSending) return

      try {
        setIsSending(true)
        setError(null)

        const response = await chatApi.sendChatMessage(conferenceId, content.trim())
        const message = convertToChatMessage(response)

        // 전송된 메시지를 목록에 추가
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === message.id)
          if (exists) {
            return prev
          }
          return [...prev, message].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        })
      } catch (err: any) {
        console.error("메시지 전송 실패:", err)
        setError(err.message || "메시지 전송에 실패했습니다")
        throw err
      } finally {
        setIsSending(false)
      }
    },
    [conferenceId, convertToChatMessage, isSending]
  )

  /**
   * 읽음 처리 (디바운싱).
   * messagesRef를 사용해 디바운스 콜백에서 항상 최신 메시지 기준으로 판단 (스테일 클로저 방지).
   */
  const markAsRead = useCallback(async () => {
    if (readDebounceTimerRef.current) {
      clearTimeout(readDebounceTimerRef.current)
    }

    readDebounceTimerRef.current = setTimeout(async () => {
      try {
        const now = new Date()
        const currentMessages = messagesRef.current
        const lastRead = lastReadAtRef.current

        const unreadMessages = currentMessages.filter(
          (msg) => !msg.isMine && (!lastRead || msg.createdAt > lastRead)
        )
        if (unreadMessages.length > 0) {
          await chatApi.markAsRead(conferenceId, now.toISOString())
          lastReadAtRef.current = now
          setLastReadAt(now)
        }
      } catch (err: any) {
        console.error("읽음 처리 실패:", err)
      }
    }, 1000)
  }, [conferenceId])

  useEffect(() => {
    messageHandlerRef.current = handleMessage
    readEventHandlerRef.current = handleReadEvent
    markAsReadRef.current = markAsRead
  }, [handleMessage, handleReadEvent, markAsRead])

  // WebSocket 구독
  useEffect(() => {
    if (!enabled || !conferenceId) return

    const messageHandler = (dto: ChatMessageResponseDto) => {
      messageHandlerRef.current?.(dto)
    }

    const readEventHandler = (event: ChatReadEventDto) => {
      readEventHandlerRef.current?.(event)
    }

    const unsubscribeFn = subscribe(conferenceId, messageHandler, readEventHandler)

    // cleanup: 구독 해제 (연결은 유지)
    return () => {
      unsubscribeFn()
    }
  }, [enabled, conferenceId, subscribe])

  // user가 변경될 때 기존 메시지들의 isMine 상태 업데이트
  useEffect(() => {
    if (user?.id) {
      setMessages((prev) =>
        prev.map((msg) => {
          const isMine =
            user.id != null &&
            msg.senderId != null &&
            String(msg.senderId).trim() === String(user.id).trim()
          return { ...msg, isMine }
        })
      )
    }
  }, [user?.id])

  // 초기 메시지 로드 (user·conferenceId가 준비된 후에만 실행). conferenceId 변경 시 다시 로드.
  const lastLoadedConferenceIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (!autoLoadMessages || !enabled || !conferenceId || !user?.id) return
    if (lastLoadedConferenceIdRef.current === conferenceId) return

    lastLoadedConferenceIdRef.current = conferenceId
    lastReadAtRef.current = null
    setLastReadAt(null)
    loadMessages(0, false).catch(() => {})
  }, [autoLoadMessages, enabled, conferenceId, user?.id, loadMessages])

  // 컴포넌트 언마운트 시 디바운스 타이머 정리
  useEffect(() => {
    return () => {
      if (readDebounceTimerRef.current) {
        clearTimeout(readDebounceTimerRef.current)
      }
    }
  }, [])

  const unreadCount = messages.filter(
    (m) => !m.isMine && (!lastReadAt || m.createdAt > lastReadAt)
  ).length

  return {
    messages,
    isLoading,
    isSending,
    error,
    hasMore,
    currentPage,
    unreadCount,
    sendMessage,
    loadMoreMessages,
    markAsRead,
    refreshMessages,
  }
}
