"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, MapPin, Users } from "lucide-react"
import { CameraTestModal } from "./camera-test-modal"

interface MatchingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onMatchFound: (sessionId: string) => void
}

const REGIONS = ["전체", "서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산"]

export function MatchingModal({ open, onOpenChange, onMatchFound }: MatchingModalProps) {
  const [step, setStep] = useState<"settings" | "camera" | "matching">("settings")
  const [region, setRegion] = useState("전체")
  const [matchingTime, setMatchingTime] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (step === "matching") {
      interval = setInterval(() => {
        setMatchingTime((prev) => prev + 1)
      }, 1000)

      const matchTimeout = setTimeout(
        () => {
          onMatchFound(`session_${Date.now()}`)
        },
        Math.random() * 100 + 100,
      )

      return () => {
        clearInterval(interval)
        clearTimeout(matchTimeout)
      }
    }
    return () => clearInterval(interval)
  }, [step, onMatchFound])

  const handleStartMatching = () => {
    setStep("camera")
  }

  const handleCameraReady = () => {
    setStep("matching")
    setMatchingTime(0)
  }

  const handleCancelMatching = () => {
    setStep("settings")
    setMatchingTime(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (step === "camera") {
    return (
      <CameraTestModal
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setStep("settings")
          }
          onOpenChange(isOpen)
        }}
        onReady={handleCameraReady}
      />
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          setStep("settings")
          setMatchingTime(0)
        }
        onOpenChange(open)
      }}
    >
      <DialogContent className="sm:max-w-md bg-background">
        {step === "settings" ? (
          <div className="py-4">
            <h2 className="text-2xl font-bold text-center mb-2">빠른 매칭</h2>
            <p className="text-muted-foreground text-center mb-6">새로운 사람과 블라인드 소개팅을 시작해보세요</p>

            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  선호 지역
                </label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="bg-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-card">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <p className="font-medium">현재 대기 중</p>
                  <p className="text-sm text-muted-foreground">
                    {region === "전체" ? "128명" : `${Math.floor(Math.random() * 30 + 10)}명`}
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleStartMatching}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-6 text-lg"
            >
              매칭 시작
            </Button>
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <div className="absolute inset-4 rounded-full bg-card flex items-center justify-center">
                <Users className="w-10 h-10 text-primary" />
              </div>
            </div>

            <h2 className="text-xl font-bold mb-2">매칭 중...</h2>
            <p className="text-muted-foreground mb-2">딱 맞는 상대를 찾고 있어요</p>
            <p className="text-3xl font-mono font-bold text-primary mb-6">{formatTime(matchingTime)}</p>

            <Button variant="outline" onClick={handleCancelMatching} className="gap-2 bg-transparent">
              <X className="w-4 h-4" />
              매칭 취소
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
