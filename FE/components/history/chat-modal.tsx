"use client"

import { useState, useRef, useEffect, useMemo, startTransition } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useChatContext } from "@/contexts/chat-context"
import { useChat } from "@/hooks/use-chat"
import { useAuth } from "@/contexts/auth-context"
import type { HistoryItem } from "@/lib/history-types"
import type { ChatMessage } from "@/lib/chat-types"

type ChatModalPartner = Pick<HistoryItem, "id" | "partnerNickname" | "date">

interface ChatModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  partner: ChatModalPartner
  isBlocked?: boolean
}

export function ChatModal({ open, onOpenChange, partner, isBlocked = false }: ChatModalProps) {
  const [newMessage, setNewMessage] = useState("")
  const [pendingMessage, setPendingMessage] = useState<ChatMessage | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const { toast } = useToast()
  const { connectionState } = useChatContext()
  const { user } = useAuth()

  const scrollToBottomRef = useRef<(() => void) | null>(null)
  scrollToBottomRef.current = () => {
    endRef.current?.scrollIntoView({ block: "end" })
  }
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollToBottomRef.current?.())
    })
  }

  const {
    messages,
    isLoading: isLoadingMessages,
    isSending: isSendingMessage,
    sendMessage: sendChatMessage,
    markAsRead: markChatAsRead,
    loadAllMessages,
  } = useChat({
    conferenceId: partner.id,
    enabled: open && !isBlocked,
    autoLoadMessages: true,
    panelOpen: open,
  })

  // 모달 열릴 때마다 전체 메시지 로드
  useEffect(() => {
    if (open && !isBlocked) {
      loadAllMessages()
    }
  }, [open, isBlocked, loadAllMessages])

  // 표시용 메시지 목록: 낙관적 메시지 추가, 서버 메시지와 중복 시 pending 제외
  const displayMessages: ChatMessage[] = useMemo(() => {
    if (!pendingMessage) return messages
    const last = messages[messages.length - 1]
    const isDuplicate =
      last?.isMine &&
      last.content === pendingMessage.content &&
      Math.abs(last.createdAt.getTime() - pendingMessage.createdAt.getTime()) < 4000
    if (isDuplicate) return messages
    return [...messages, pendingMessage]
  }, [messages, pendingMessage])

  const prevLengthRef = useRef(0)
  useEffect(() => {
    if (!open || displayMessages.length <= prevLengthRef.current) return
    prevLengthRef.current = displayMessages.length
    if (isAtBottom) scrollToBottom()
  }, [open, displayMessages.length, isAtBottom])

  useEffect(() => {
    if (open && !isBlocked) {
      markChatAsRead()
    }
  }, [open, isBlocked, markChatAsRead])

  // 모달이 열릴 때만 맨 아래로 스크롤
  useEffect(() => {
    if (open) {
      prevLengthRef.current = displayMessages.length
      scrollToBottom()
      setIsAtBottom(true)
    }
  }, [open])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSendingMessage || isBlocked) return
    const trimmed = newMessage.trim()
    setNewMessage("")

    // 낙관적 표시 (use-chat 수정 없이 컴포넌트에서만 처리)
    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      senderId: user?.id ?? null,
      senderNickname: user?.nickname ?? null,
      type: "USER",
      content: trimmed,
      createdAt: new Date(),
      isReadByPartner: false,
      isMine: true,
    }
    setPendingMessage(optimistic)

    try {
      await sendChatMessage(trimmed)
      startTransition(() => setPendingMessage(null))
    } catch (error: any) {
      setPendingMessage(null)
      setNewMessage(trimmed)
      toast({
        title: "메시지 전송 실패",
        description: error.message || "메시지를 전송하는데 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background h-[80vh] max-h-[600px] flex flex-col p-0 gap-0" showCloseButton={false}>
        <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div className="flex flex-col gap-0.5">
            <DialogTitle className="font-semibold text-base mb-0">
              채팅 <span className="text-muted-foreground font-normal">· {partner.partnerNickname}</span>
            </DialogTitle>
            {open && connectionState !== "connected" && !isBlocked && (
              <span className="text-xs text-muted-foreground">실시간 연결 중...</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={() => {
            if (!scrollContainerRef.current) return
            const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
            const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)
            setIsAtBottom(distanceFromBottom < 40)
          }}
          className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
        >
          {isLoadingMessages && displayMessages.length === 0 ? (
            <div className="flex items-center justify-center py-8 flex-shrink-0">
              <div className="text-sm text-muted-foreground">메시지를 불러오는 중...</div>
            </div>
          ) : displayMessages.length === 0 ? (
            <div className="flex items-center justify-center py-8 flex-shrink-0">
              <div className="text-sm text-muted-foreground text-center">
                메시지가 없습니다.
                <br />
                <span className="text-xs">새로운 메시지를 보내보세요!</span>
              </div>
            </div>
          ) : (
            displayMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 flex-shrink-0 ${msg.isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    msg.isMine
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  <div className="break-words">{msg.content}</div>
                </div>
                {!msg.isMine && <div className="w-4 flex-shrink-0" />}
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>

        <div className="p-4 border-t border-border flex-shrink-0">
          {isBlocked ? (
            <p className="text-sm text-muted-foreground text-center">차단된 상대입니다.</p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex gap-2"
            >
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="메시지를 입력하세요..."
                className="bg-input"
              />
              <Button
                type="submit"
                size="icon"
                className="bg-primary text-primary-foreground"
                disabled={isSendingMessage}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
