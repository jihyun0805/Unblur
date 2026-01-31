"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { UserProfileModal, UserProfileData } from "@/components/common/user-profile-modal"
import * as matchApi from "@/lib/api/match"
import type { OnlineUserDto } from "@/lib/api/match"

export interface MatchedUser {
  id: string
  nickname: string
  isOnline: boolean
  /** 선명도 (0-100%) */
  clarity: number
  /** 프로필 정보 */
  profile?: UserProfileData
}

function mapOnlineUserToMatched(dto: OnlineUserDto): MatchedUser {
  return {
    id: dto.id,
    nickname: dto.nickname,
    isOnline: true,
    clarity: dto.clarityScore ?? 0,
    profile: {
      nickname: dto.nickname,
      temperature: dto.clarityScore ?? 0,
      age: dto.age,
      gender: dto.gender?.toLowerCase() === "female" ? "female" : "male",
      region: dto.region ?? "",
      mbti: dto.mbti ?? undefined,
      bio: dto.intro ?? undefined,
      interests: dto.interestTags ?? [],
    },
  }
}

interface OneOnOneModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRequestChat: (userId: string) => void
}

export function OneOnOneModal({ open, onOpenChange, onRequestChat }: OneOnOneModalProps) {
  const { toast } = useToast()
  const [matchedUsers, setMatchedUsers] = useState<MatchedUser[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setIsLoading(true)
    matchApi
      .getOnlineUsers(10)
      .then((res) => setMatchedUsers((res.onlineUsers ?? []).map(mapOnlineUserToMatched)))
      .catch(() => {
        toast({
          title: "목록 조회 실패",
          description: "온라인 사용자를 불러오지 못했습니다.",
          variant: "destructive",
        })
        setMatchedUsers([])
      })
      .finally(() => setIsLoading(false))
  }, [open, toast])

  const onlineUsers = matchedUsers.filter((user) => user.isOnline)

  const handleRequestChat = async (userId: string, nickname: string) => {
    try {
      await matchApi.startOneOnOneMatch(userId)
      toast({
        title: "1:1 매칭 요청",
        description: `${nickname}님에게 매칭 요청을 보냈습니다. 수락 시 세션방으로 이동합니다.`,
      })
      onRequestChat(userId)
      onOpenChange(false)
    } catch (err) {
      toast({
        title: "요청 실패",
        description: err instanceof Error ? err.message : "매칭 요청에 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">1:1 매칭</DialogTitle>
          <p className="text-sm text-muted-foreground text-center mt-2">
            현재 활동 중인 사람들에게 매칭 요청을 보내보세요!
          </p>
        </DialogHeader>

        <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          ) : onlineUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">현재 온라인인 사람이 없습니다</p>
              <p className="text-sm text-muted-foreground">나중에 다시 확인해보세요</p>
            </div>
          ) : (
            onlineUsers.map((user) => (
              <UserListItem
                key={user.id}
                user={user}
                onRequestChat={handleRequestChat}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** 사용자 목록 아이템 컴포넌트 */
function UserListItem({ 
  user, 
  onRequestChat 
}: { 
  user: MatchedUser
  onRequestChat: (userId: string, nickname: string) => void 
}) {
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
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
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="font-semibold truncate hover:text-primary cursor-pointer text-left"
            >
              {user.nickname}
            </button>
            <p className="text-xs text-muted-foreground">선명도 {user.clarity}%</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => onRequestChat(user.id, user.nickname)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Send className="w-4 h-4 mr-1" />
          매칭 요청
        </Button>
      </div>

      <UserProfileModal
        open={profileOpen}
        onOpenChange={setProfileOpen}
        profile={user.profile || { nickname: user.nickname, temperature: user.clarity }}
      />
    </>
  )
}
