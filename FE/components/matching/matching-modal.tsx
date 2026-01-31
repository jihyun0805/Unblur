"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Users } from "lucide-react"
import { CameraTestModal } from "./camera-test-modal"
import { useMatchSse } from "@/contexts/match-sse-context"
import { useToast } from "@/hooks/use-toast"
import * as matchApi from "@/lib/api/match"
import type { QuickMatchResultPayload } from "@/contexts/match-sse-context"

interface MatchingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onMatchFound: (sessionId: string) => void
}

export function MatchingModal({ open, onOpenChange, onMatchFound }: MatchingModalProps) {
  const [step, setStep] = useState<"camera" | "matching">("camera")
  const [matchingTime, setMatchingTime] = useState(0)
  const [requestId, setRequestId] = useState<string | null>(null)
  const { subscribe, disconnect } = useMatchSse()
  const { toast } = useToast()
  const onMatchFoundRef = useRef(onMatchFound)
  onMatchFoundRef.current = onMatchFound

  // 빠른 매칭 시작 + SSE 구독
  useEffect(() => {
    if (step !== "matching" || !open) return

    let cancelled = false
    matchApi
      .startQuickMatch()
      .then((res) => {
        if (cancelled) return
        setRequestId(res.requestId)
      })
      .catch((err) => {
        if (cancelled) return
        toast({
          title: "매칭 시작 실패",
          description: err instanceof Error ? err.message : "잠시 후 다시 시도해주세요.",
          variant: "destructive",
        })
        setStep("camera")
      })

    const unsubMatched = subscribe("quick-match-matched", (data) => {
      const payload = data as QuickMatchResultPayload
      if (!payload?.conferenceId) return
      disconnect()
      onMatchFoundRef.current(payload.conferenceId)
      onOpenChange(false)
    })
    const unsubTimeout = subscribe("quick-match-timeout", () => {
      toast({
        title: "매칭 시간 초과",
        description: "다시 시도해주세요.",
        variant: "destructive",
      })
      setStep("camera")
      setRequestId(null)
    })
    const unsubCanceled = subscribe("quick-match-canceled", () => {
      setStep("camera")
      setRequestId(null)
    })

    return () => {
      cancelled = true
      unsubMatched()
      unsubTimeout()
      unsubCanceled()
    }
  }, [step, open, subscribe, disconnect, onOpenChange, toast])

  // 매칭 중 타이머
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (step === "matching") {
      interval = setInterval(() => {
        setMatchingTime((prev) => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [step])

  const handleCameraReady = () => {
    setStep("matching")
    setMatchingTime(0)
    setRequestId(null)
  }

  const handleCancelMatching = async () => {
    if (requestId) {
      try {
        await matchApi.cancelQuickMatch(requestId)
      } catch (err) {
        toast({
          title: "취소 실패",
          description: err instanceof Error ? err.message : "매칭 취소에 실패했습니다.",
          variant: "destructive",
        })
      }
    }
    setRequestId(null)
    setStep("camera")
    setMatchingTime(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // 모달 닫을 때 진행 중인 빠른 매칭 취소
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && requestId) {
      matchApi.cancelQuickMatch(requestId).catch(() => {})
      setRequestId(null)
    }
    if (!isOpen) {
      setStep("camera")
      setMatchingTime(0)
    }
    onOpenChange(isOpen)
  }

  if (step === "camera") {
    return (
      <CameraTestModal
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) setStep("camera")
          onOpenChange(isOpen)
        }}
        onReady={handleCameraReady}
      />
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="sm:max-w-md bg-background">
        <DialogTitle className="sr-only">빠른 매칭</DialogTitle>
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
      </DialogContent>
    </Dialog>
  )
}
