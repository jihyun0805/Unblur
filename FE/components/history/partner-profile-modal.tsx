"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Thermometer, MessageCircle, Heart, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PartnerProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  partner: {
    nickname: string
    partnerTemp: number
    date: string
    duration: string
    rounds: number
    chatEnabled: boolean
  }
}

export function PartnerProfileModal({ open, onOpenChange, partner }: PartnerProfileModalProps) {
  const getTemperatureColor = (temp: number) => {
    if (temp >= 40) return "text-red-500"
    if (temp >= 38) return "text-orange-500"
    if (temp >= 36) return "text-green-500"
    if (temp >= 34) return "text-blue-500"
    return "text-blue-700"
  }

  const getTemperatureLabel = (temp: number) => {
    if (temp >= 40) return "매우 따뜻한 매너"
    if (temp >= 38) return "따뜻한 매너"
    if (temp >= 36) return "보통 매너"
    if (temp >= 34) return "조금 차가운 매너"
    return "차가운 매너"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background">
        <DialogHeader>
          <DialogTitle className="text-center">프로필</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar and Name */}
          <div className="flex flex-col items-center gap-3">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                {partner.nickname[0]}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="text-xl font-bold">{partner.nickname}</h3>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Thermometer className={`w-4 h-4 ${getTemperatureColor(partner.partnerTemp)}`} />
                <span className={`text-lg font-semibold ${getTemperatureColor(partner.partnerTemp)}`}>
                  {partner.partnerTemp.toFixed(1)}°
                </span>
                <span className="text-sm text-muted-foreground">
                  {getTemperatureLabel(partner.partnerTemp)}
                </span>
              </div>
            </div>
          </div>

          {/* Meeting Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">만난 날짜</span>
              </div>
              <span className="font-medium">{partner.date}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="text-sm">진행 라운드</span>
              </div>
              <span className="font-medium">{partner.rounds}/4 라운드</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">채팅 상태</span>
              </div>
              <Badge variant={partner.chatEnabled ? "default" : "secondary"} className={partner.chatEnabled ? "bg-green-600 text-white" : ""}>
                {partner.chatEnabled ? "ON" : "OFF"}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          {partner.chatEnabled && (
            <div className="flex gap-2">
              <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                <MessageCircle className="w-4 h-4 mr-2" />
                채팅하기
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
