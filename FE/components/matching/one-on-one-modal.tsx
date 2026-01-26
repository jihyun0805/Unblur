"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { UserProfileModal, UserProfileData } from "@/components/common/user-profile-modal"

export interface MatchedUser {
  id: string
  nickname: string
  isOnline: boolean
  /** 선명도 (0-100%) */
  clarity: number
  /** 프로필 정보 */
  profile?: UserProfileData
}

interface OneOnOneModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRequestChat: (userId: string) => void
  /** 이전 매칭 이력 목록 */
  matchedUsers?: MatchedUser[]
  /** 데이터 로딩 중 여부 */
  isLoading?: boolean
}

// TODO: 실제 API 연동 시 제거
const MOCK_MATCHED_USERS: MatchedUser[] = [
  { id: "1", nickname: "민지", isOnline: true, clarity: 85, profile: { nickname: "민지", temperature: 85, age: 25, gender: "female", region: "서울", mbti: "ENFP", bio: "반가워요!", interests: ["travel", "music"] } },
  { id: "2", nickname: "준혁", isOnline: false, clarity: 60, profile: { nickname: "준혁", temperature: 60, age: 28, gender: "male", region: "부산", mbti: "ISTJ", bio: "안녕하세요", interests: ["game", "movie"] } },
  { id: "3", nickname: "서연", isOnline: true, clarity: 100, profile: { nickname: "서연", temperature: 100, age: 24, gender: "female", region: "대전", mbti: "INFJ", bio: "좋은 만남 기대해요", interests: ["book", "cafe"] } },
  { id: "4", nickname: "동현", isOnline: false, clarity: 45, profile: { nickname: "동현", temperature: 45, age: 30, gender: "male", region: "인천", mbti: "ENTP", bio: "개발자입니다", interests: ["game", "travel"] } },
  { id: "5", nickname: "유진", isOnline: true, clarity: 72, profile: { nickname: "유진", temperature: 72, age: 26, gender: "female", region: "서울", mbti: "ESFJ", bio: "운동 좋아해요", interests: ["exercise", "music"] } },
]

export function OneOnOneModal({ 
  open, 
  onOpenChange, 
  onRequestChat,
  matchedUsers = MOCK_MATCHED_USERS,
  isLoading = false,
}: OneOnOneModalProps) {
  const { toast } = useToast()
  const onlineUsers = matchedUsers.filter((user) => user.isOnline)

  const handleRequestChat = (userId: string, nickname: string) => {
    toast({
      title: "1:1 매칭 수락!",
      description: "상대방이 매칭 요청을 수락했습니다. 매칭방으로 이동하시겠습니까?",
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
