"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { SURVEY_QUESTIONS } from "@/lib/survey-questions"
import { getLoveDnaImage } from "@/lib/profile-image"

export interface UserProfileData {
  nickname?: string
  temperature?: number
  age?: number
  gender?: string
  region?: string
  bio?: string
  mbti?: string
  loveDna?: string
  interests?: string[]
  roundSummaries?: (string | null)[]
}

interface UserProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: UserProfileData
  isLoading?: boolean
  showSummaries?: boolean
}

export function UserProfileModal({
  open,
  onOpenChange,
  profile,
  isLoading = false,
  showSummaries = false,
}: UserProfileModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">사용자 프로필</DialogTitle>
        <div className="space-y-3 pt-2">
          {/* 닉네임, 선명도 */}
          <div className="flex items-center gap-4 px-4">
            <img
              src={getLoveDnaImage(profile.loveDna)}
              alt={profile.nickname ? `${profile.nickname} 프로필 이미지` : "프로필 이미지"}
              className="w-16 h-16 rounded-full object-cover bg-card flex-shrink-0"
            />
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

          {showSummaries && (
            <div className="space-y-3 p-4 rounded-xl bg-card">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">AI 대화 요약</p>
                <span className="text-xs text-muted-foreground">라운드별 1줄 요약</span>
              </div>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">요약을 불러오는 중...</p>
              ) : profile.roundSummaries && profile.roundSummaries.length > 0 ? (
                <div className="space-y-2">
                  {profile.roundSummaries.map((summary, index) => (
                    <div key={`${index + 1}-${index}`} className="text-sm text-foreground">
                      <span className="text-xs text-muted-foreground mr-2">{`라운드 ${index + 1}`}</span>
                      {typeof summary === "string" && summary.trim() ? summary : "나눈 대화가 적어 요약한 내용이 없어요"}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">요약이 없습니다.</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
