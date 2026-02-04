"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { ChatMessage } from "@/lib/chat-types"

interface ChatPanelProps {
  messages: ChatMessage[]
  isLoading: boolean
  isSending: boolean
  sendMessage: (content: string) => Promise<void>
  markAsRead?: () => void
  onClose?: () => void
  showCloseButton?: boolean
  className?: string
}

export function ChatPanel({
  messages,
  isLoading: isLoadingMessages,
  isSending: isSendingMessage,
  sendMessage: sendChatMessage,
  markAsRead: markChatAsRead,
  onClose,
  showCloseButton = true,
  className = "",
}: ChatPanelProps) {
  const [newMessage, setNewMessage] = useState("")
  const listRef = useRef<HTMLDivElement | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (!isAtBottom) return
    endRef.current?.scrollIntoView({ block: "end" })
  }, [messages, isAtBottom])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSendingMessage) return
    try {
      await sendChatMessage(newMessage.trim())
      setNewMessage("")
    } catch (error: any) {
      toast({
        title: "메시지 전송 실패",
        description: error.message || "메시지를 전송하는데 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {showCloseButton && (
        <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <h3 className="font-semibold">채팅</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
      <div
        ref={listRef}
        onScroll={() => {
          if (!listRef.current) return
          const { scrollTop, scrollHeight, clientHeight } = listRef.current
          const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)
          setIsAtBottom(distanceFromBottom < 40)
        }}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {isLoadingMessages && messages.length === 0 ? (
          <div className="flex items-center justify-center py-8 flex-shrink-0">
            <div className="text-sm text-muted-foreground">메시지를 불러오는 중...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-8 flex-shrink-0">
            <div className="text-sm text-muted-foreground text-center">
              메시지가 없습니다.
              <br />
              <span className="text-xs">새로운 메시지를 보내보세요!</span>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
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
      </div>
    </div>
  )
}
