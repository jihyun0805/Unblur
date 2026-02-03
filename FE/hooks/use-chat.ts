"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useChatContext } from "@/contexts/chat-context"
import { useAuth } from "@/contexts/auth-context"
import * as chatApi from "@/lib/api/chat"
import type { ChatMessage, ChatMessageResponseDto } from "@/lib/chat-types"

interface UseChatOptions {
  conferenceId: string
  enabled?: boolean // WebSocket 구독 활성화 여부
  autoLoadMessages?: boolean // 자동으로 메시지 로드 여부
  /** true일 때만 채팅 API 호출(회의 입장 완료 후). 미설정 시 true로 동작 */
  canLoadMessages?: boolean
  pageSize?: number // 페이지 크기
  /** 채팅 패널이 열려 있으면 true */
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
  /** 마지막 읽은 시각 (미확인 배지용) */
  lastReadAt: Date | null
  sendMessage: (content: string) => Promise<void>
  loadMoreMessages: () => Promise<void>
  markAsRead: () => void
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
  canLoadMessages = true,
  pageSize = 100,
  panelOpen = false,
}: UseChatOptions): UseChatReturn {
  const { subscribe, unsubscribe } = useChatContext()
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  /** 마지막으로 읽은 시각 (미확인 배지용, 패널 닫혀 있어도 유지) */
  const [lastReadAt, setLastReadAt] = useState<Date | null>(null)

  const lastReadAtRef = useRef<Date | null>(null)
  const isLoadingRef = useRef(false)

  const messageHandlerRef = useRef<((message: ChatMessageResponseDto) => void) | null>(null)
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
    },
    [convertToChatMessage]
  )

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

        setMessages((prev) => {
          const exists = prev.some((m) => m.id === message.id)
          if (exists) return prev
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
   * 읽음 처리: 로컬 lastReadAt 갱신 + 서버 API 호출 (새로고침 후에도 빨간점 유지 제거)
   * lastReadAt은 null로 보내 서버에서 LocalDateTime.now() 사용 (타임존/파싱 이슈 방지)
   */
  const markAsRead = useCallback(() => {
    const now = new Date()
    lastReadAtRef.current = now
    setLastReadAt(now)
    chatApi.markAsRead(conferenceId, null).catch((err) => {
      console.warn("[Chat] 읽음 처리 API 실패:", err)
    })
  }, [conferenceId])

  useEffect(() => {
    messageHandlerRef.current = handleMessage
  }, [handleMessage])

  // WebSocket 구독 (메시지만 구독, 읽음 이벤트 미구독)
  useEffect(() => {
    if (!enabled || !conferenceId) return

    const messageHandler = (dto: ChatMessageResponseDto) => {
      messageHandlerRef.current?.(dto)
    }

    const unsubscribeFn = subscribe(conferenceId, messageHandler)

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

  // 초기 메시지 로드: 회의 입장(join) 완료 후에만 호출. 백엔드는 ConferenceParticipant 있을 때만 채팅 허용.
  const lastLoadedConferenceIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (!autoLoadMessages || !canLoadMessages || !enabled || !conferenceId || !user?.id) return
    if (lastLoadedConferenceIdRef.current === conferenceId) return

    lastLoadedConferenceIdRef.current = conferenceId
    loadMessages(0, false).catch(() => {})
  }, [autoLoadMessages, canLoadMessages, enabled, conferenceId, user?.id, loadMessages])

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
    lastReadAt,
    sendMessage,
    loadMoreMessages,
    markAsRead,
    refreshMessages,
  }
}
