"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Loader2, User, Trash2, Pencil, X } from "lucide-react"

interface ProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MBTI_TYPES = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
]

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const { user, updateUser, deleteAccount } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    nickname: user?.nickname || "",
    bio: user?.bio || "",
    mbti: user?.mbti || "",
  })

  useEffect(() => {
    if (user) {
      setFormData({
        nickname: user.nickname || "",
        bio: user.bio || "",
        mbti: user.mbti || "",
      })
    }
  }, [user])

  useEffect(() => {
    if (!open) {
      setIsEditing(false)
      setShowDeleteConfirm(false)
      setDeletePassword("")
    }
  }, [open])

  useEffect(() => {
    if (!showDeleteConfirm) {
      setDeletePassword("")
    }
  }, [showDeleteConfirm])

  const handleSave = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))

    updateUser(formData)
    setIsLoading(false)
    setIsEditing(false)

    toast({
      title: "프로필 수정 완료",
      description: "프로필이 성공적으로 업데이트되었습니다.",
    })
  }

  const handleCancelEdit = () => {
    setFormData({
      nickname: user?.nickname || "",
      bio: user?.bio || "",
      mbti: user?.mbti || "",
    })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!deletePassword) {
      toast({
        title: "?? ??",
        description: "????? ??????.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    const success = await deleteAccount(deletePassword)
    setIsLoading(false)

    if (!success) {
      toast({
        title: "???? ??",
        description: "????? ???? ????.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "?? ?? ??",
      description: "??? ????? ???????.",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">프로필 설정</DialogTitle>
        </DialogHeader>

        {!showDeleteConfirm ? (
          <div className="space-y-4 mt-4">
            {/* Avatar */}
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center">
                <User className="w-12 h-12 text-primary-foreground" />
              </div>
            </div>

            {/* Info Display */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-card">
              <div>
                <p className="text-xs text-muted-foreground">나이</p>
                <p className="font-medium">{user?.age}세</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">성별</p>
                <p className="font-medium">{user?.gender === "male" ? "남성" : "여성"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">지역</p>
                <p className="font-medium">{user?.region}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">생년월일</p>
                <p className="font-medium">{user?.birthDate || "-"}</p>
              </div>
            </div>

            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nickname">닉네임</Label>
                  <Input
                    id="nickname"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className="bg-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">한 줄 소개</Label>
                  <Textarea
                    id="bio"
                    placeholder="자신을 한 줄로 소개해보세요"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="bg-input resize-none"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>MBTI</Label>
                  <Select value={formData.mbti} onValueChange={(value) => setFormData({ ...formData, mbti: value })}>
                    <SelectTrigger className="bg-input">
                      <SelectValue placeholder="MBTI를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {MBTI_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleCancelEdit} className="flex-1 bg-transparent">
                    <X className="w-4 h-4 mr-2" />
                    취소
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      "저장하기"
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* 읽기 전용 표시 */}
                <div className="space-y-4 p-4 rounded-xl bg-card">
                  <div>
                    <p className="text-xs text-muted-foreground">닉네임</p>
                    <p className="font-medium">{user?.nickname || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">한 줄 소개</p>
                    <p className="font-medium">{user?.bio || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">MBTI</p>
                    <p className="font-medium">{user?.mbti || "-"}</p>
                  </div>
                </div>

                <Button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  프로필 수정
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              계정 삭제
            </Button>
          </div>
        ) : (
          <div className="py-4 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">정말 탈퇴하시겠어요?</h3>
            <p className="text-muted-foreground text-sm mb-6">탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.</p>
            <div className="space-y-2 text-left mb-6">
              <Label htmlFor="delete-password">비밀번호</Label>
              <Input
                id="delete-password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="bg-input"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
                취소
              </Button>
              <Button variant="destructive" onClick={handleDelete} className="flex-1" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "탈퇴하기"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
