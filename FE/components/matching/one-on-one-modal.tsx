"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { X, MessageCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface OneOnOneModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRequestChat: (userId: string) => void
}

// Mock data - 실제로는 이전 매칭 이력에서 가져와야 함
const previousMatches = [
  { id: "1", nickname: "민지", isOnline: true, lastChat: "2시간 전" },
  { id: "2", nickname: "준혁", isOnline: false, lastChat: "1일 전" },
  { id: "3", nickname: "서연", isOnline: true, lastChat: "3시간 전" },
  { id: "4", nickname: "동현", isOnline: false, lastChat: "2일 전" },
  { id: "5", nickname: "유진", isOnline: true, lastChat: "30분 전" },
]

export function OneOnOneModal({ open, onOpenChange, onRequestChat }: OneOnOneModalProps) {
  const { toast } = useToast()
  const onlineUsers = previousMatches.filter((user) => user.isOnline)

  const handleRequestChat = (userId: string, nickname: string) => {
    toast({
      title: "1:1 채팅 요청",
      description: `${nickname}님에게 채팅 요청을 보냈습니다.`,
    })
    onRequestChat(userId)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">1:1 채팅</DialogTitle>
          <p className="text-sm text-muted-foreground text-center mt-2">
            이전에 대화했던 사람 중 온라인인 사람들입니다
          </p>
        </DialogHeader>

        <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
          {onlineUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">현재 온라인인 사람이 없습니다</p>
              <p className="text-sm text-muted-foreground">나중에 다시 확인해보세요</p>
            </div>
          ) : (
            onlineUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {user.nickname.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
                  </div>
                  <div>
                    <p className="font-semibold">{user.nickname}</p>
                    <p className="text-xs text-muted-foreground">{user.lastChat} 대화</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleRequestChat(user.id, user.nickname)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  채팅 요청
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
