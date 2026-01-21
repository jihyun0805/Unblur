"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Heart } from "lucide-react"
import type { HistoryItem } from "@/lib/history-types"

type ChatModalPartner = Pick<HistoryItem, "id" | "partnerNickname" | "date">

interface ChatModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  partner: ChatModalPartner
  isBlocked?: boolean
}

interface Message {
  id: string
  sender: "me" | "partner"
  text: string
  timestamp: string
}

// Mock messages for demo
const MOCK_MESSAGES: Message[] = [
  { id: "1", sender: "partner", text: "안녕하세요! 오늘 대화 정말 즐거웠어요 😊", timestamp: "14:30" },
  { id: "2", sender: "me", text: "저도요! 이야기 나누면서 시간 가는 줄 몰랐어요", timestamp: "14:31" },
  { id: "3", sender: "partner", text: "혹시 시간 되시면 커피 한잔 어떠세요?", timestamp: "14:32" },
  { id: "4", sender: "me", text: "좋아요! 이번 주말 어떠세요?", timestamp: "14:33" },
  { id: "5", sender: "partner", text: "토요일 오후 괜찮아요!", timestamp: "14:35" },
]

export function ChatModal({ open, onOpenChange, partner, isBlocked = false }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES)
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const now = new Date()
    const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "me",
        text: newMessage,
        timestamp,
      },
    ])
    setNewMessage("")

    // Simulate partner response
    setTimeout(() => {
      const responseTime = new Date()
      const responseTimestamp = `${responseTime.getHours().toString().padStart(2, "0")}:${responseTime.getMinutes().toString().padStart(2, "0")}`
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "partner",
          text: "네, 좋아요! 연락드릴게요 😄",
          timestamp: responseTimestamp,
        },
      ])
    }, 2000)
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
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                  msg.sender === "me" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card rounded-bl-md"
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}
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
              <Button type="submit" size="icon" className="bg-primary text-primary-foreground flex-shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
