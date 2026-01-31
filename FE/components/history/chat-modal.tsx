"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Heart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useChat } from "@/hooks/use-chat"
import type { HistoryItem } from "@/lib/history-types"

type ChatModalPartner = Pick<HistoryItem, "id" | "partnerNickname" | "date">

interface ChatModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  partner: ChatModalPartner
  isBlocked?: boolean
}

export function ChatModal({ open, onOpenChange, partner, isBlocked = false }: ChatModalProps) {
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // 채팅 훅 사용 (히스토리 모드: WebSocket 구독 비활성화)
  const {
    messages,
    isLoading: isLoadingMessages,
    isSending: isSendingMessage,
    sendMessage: sendChatMessage,
    markAsRead: markChatAsRead,
  } = useChat({
    conferenceId: partner.id,
    enabled: open && !isBlocked, // 모달이 열려있고 차단되지 않았을 때만 구독
    autoLoadMessages: true,
  })

  // 모달이 열릴 때 읽음 처리
  useEffect(() => {
    if (open && !isBlocked) {
      markChatAsRead()
    }
  }, [open, isBlocked, markChatAsRead])

  // 메시지 변경 시 스크롤
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, open])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSendingMessage || isBlocked) return

    try {
      await sendChatMessage(newMessage.trim())
      setNewMessage("")
      markChatAsRead() // 메시지 전송 후 읽음 처리
    } catch (error: any) {
      toast({
        title: "메시지 전송 실패",
        description: error.message || "메시지를 전송하는데 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background h-[80vh] max-h-[600px] flex flex-col p-0">
        <DialogHeader className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Heart className="w-5 h-5 text-green-600 fill-green-600" />
            </div>
            <div>
              <DialogTitle className="text-lg">{partner.partnerNickname}</DialogTitle>
              <p className="text-xs text-muted-foreground">매칭일: {partner.date}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoadingMessages && messages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">메시지를 불러오는 중...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">메시지가 없습니다.</div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    msg.isMine
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card rounded-bl-md"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {formatTime(msg.createdAt)}
                  </p>
                  {msg.isMine && (
                    <div className="text-xs mt-1 opacity-70">
                      {msg.isReadByPartner ? "✓✓" : "✓"}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input / 차단 시 문구 */}
        <div className="p-4 border-t border-border">
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
                className="bg-input flex-1"
              />
              <Button
                type="submit"
                size="icon"
                className="bg-primary text-primary-foreground flex-shrink-0"
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
