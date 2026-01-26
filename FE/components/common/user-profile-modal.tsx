"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { User } from "lucide-react"
import { SURVEY_QUESTIONS } from "@/lib/survey-questions"

export interface UserProfileData {
  nickname?: string
  temperature?: number
  age?: number
  gender?: string
  region?: string
  bio?: string
  mbti?: string
  interests?: string[]
}

interface UserProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: UserProfileData
}

export function UserProfileModal({ open, onOpenChange, profile }: UserProfileModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background max-h-[90vh] overflow-y-auto">
        <div className="space-y-3 pt-2">
          {/* 닉네임, 선명도 */}
          <div className="flex items-center gap-4 px-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <User className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{profile.nickname || "-"}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm font-medium text-primary">
                  {Math.round(profile.temperature || 0)}%
                </span>
                <span className="text-xs text-muted-foreground">선명도</span>
              </div>
            </div>
          </div>

          {/* 나이 성별 지역 */}
          <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-card">
            <div>
              <p className="text-xs text-muted-foreground">나이</p>
              <p className="font-medium">{profile.age != null ? `${profile.age}세` : "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">성별</p>
              <p className="font-medium">
                {profile.gender === "male" ? "남성" : profile.gender === "female" ? "여성" : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">지역</p>
              <p className="font-medium">{profile.region || "-"}</p>
            </div>
          </div>

          <hr className="border-border" />

          {/* MBTI, 한줄소개, 관심사태그 */}
          <div className="space-y-4 p-4 rounded-xl bg-card">
            <div>
              <p className="text-xs text-muted-foreground">MBTI</p>
              <p className="font-medium">{profile.mbti || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">한 줄 소개</p>
              <p className="font-medium">{profile.bio || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">관심사</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {profile.interests && profile.interests.length > 0 ? (
                  SURVEY_QUESTIONS.interests.options
                    .filter((option) => profile.interests?.includes(option.value))
                    .map((option) => (
                      <Badge key={option.value} variant="secondary">
                        {option.label}
                      </Badge>
                    ))
                ) : (
                  <span className="text-sm text-muted-foreground">선택한 관심사 없음</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
