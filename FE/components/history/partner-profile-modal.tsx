"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Thermometer, MessageCircle, Heart, Calendar, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getTemperatureColor, getTemperatureLabel } from "./utils"

interface PartnerProfileModalPartner {
  partnerNickname?: string
  age?: number
  gender?: string
  region?: string
  birthDate?: string
  bio?: string
  mbti?: string
}

interface PartnerProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  partner: PartnerProfileModalPartner
}

export function PartnerProfileModal({ open, onOpenChange, partner }: PartnerProfileModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">프로필</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Avatar (profile-modal과 동일) */}
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center">
              <User className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>

          {/* Info Display - 나이, 성별, 지역, 생년월일 (profile-modal과 동일 그리드) */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-card">
            <div>
              <p className="text-xs text-muted-foreground">나이</p>
              <p className="font-medium">{partner.age != null ? `${partner.age}세` : "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">성별</p>
              <p className="font-medium">
                {partner.gender === "male" ? "남성" : partner.gender === "female" ? "여성" : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">지역</p>
              <p className="font-medium">{partner.region || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">생년월일</p>
              <p className="font-medium">{partner.birthDate || "-"}</p>
            </div>
          </div>

          {/* 읽기 전용 - 닉네임, 한 줄 소개, MBTI (profile-modal과 동일) */}
          <div className="space-y-4 p-4 rounded-xl bg-card">
            <div>
              <p className="text-xs text-muted-foreground">닉네임</p>
              <p className="font-medium">{partner.partnerNickname || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">한 줄 소개</p>
              <p className="font-medium">{partner.bio || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">MBTI</p>
              <p className="font-medium">{partner.mbti || "-"}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
