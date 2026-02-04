"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useMatchSse } from "@/contexts/match-sse-context"
import { useSessionId } from "@/contexts/session-id-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { MatchingModal } from "@/components/matching/matching-modal"
import { OneOnOneModal } from "@/components/matching/one-on-one-modal"
import { CameraTestModal } from "@/components/matching/camera-test-modal"
import { Camera, Users, Zap, UserPlus } from "lucide-react"
import { stopAllStreams } from "@/lib/media-streams"

export function HomePage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { subscribe } = useMatchSse()
  const { enterSession } = useSessionId()
  const [showMatching, setShowMatching] = useState(false)
  const [showOneOnOne, setShowOneOnOne] = useState(false)
  const [waitingRequestId, setWaitingRequestId] = useState<string | null>(null)
  const [isWaitingModalOpen, setIsWaitingModalOpen] = useState(false)
  const [isCameraTestOpen, setIsCameraTestOpen] = useState(false)

  useEffect(() => {
    stopAllStreams()
  }, [])

  useEffect(() => {
    if (!waitingRequestId) return
    const handleClose = (data: unknown) => {
      const payload = data as { requestId?: string; request_id?: string } | undefined
      const requestId = payload?.requestId ?? payload?.request_id
      if (requestId && requestId !== waitingRequestId) return
      setIsWaitingModalOpen(false)
      setWaitingRequestId(null)
    }
    const unsubAccepted = subscribe("one-on-one-accepted", handleClose)
    const unsubDeclined = subscribe("one-on-one-declined", handleClose)
    const unsubTimeout = subscribe("one-on-one-timeout", handleClose)
    return () => {
      unsubAccepted()
      unsubDeclined()
      unsubTimeout()
    }
  }, [subscribe, waitingRequestId])

  const handleMatchFound = (sessionId: string) => {
    setShowMatching(false)
    enterSession(sessionId)
  }

  /** 1:1 요청은 OneOnOneModal에서 API 호출 후 처리. 수락 시 MatchRequestToaster가 세션으로 이동시킴. */
  const handleRequestChat = (payload: { requestId: string }) => {
    setWaitingRequestId(payload.requestId)
    setIsWaitingModalOpen(true)
  }

  const getTemperatureColor = (clarity: number) => {
    return "text-primary"
  }

  const getClarityPercent = (clarity: number) => {
    const percent = Math.round(clarity)
    return Math.max(0, Math.min(100, percent))
  }

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">안녕하세요, {user?.nickname}님!</h1>
          <p className="text-muted-foreground text-sm sm:text-base">오늘도 특별한 만남이 기다리고 있어요.</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-card cursor-default">
                <span className={`font-semibold ${getTemperatureColor(user?.temperature ?? 50)}`}>
                  {getClarityPercent(user?.temperature ?? 50)}%
                </span>
                <span className="text-xs text-muted-foreground">선명도</span>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              sideOffset={12}
              align="start"
              alignOffset={-6}
              className="max-w-[260px] text-[11px] leading-relaxed bg-slate-900 text-slate-100 border border-white/10 shadow-[0_10px_30px_rgba(15,23,42,0.35)] rounded-lg px-3.5 py-2.5 [&_[data-slot=tooltip-arrow]]:bg-slate-900 [&_[data-slot=tooltip-arrow]]:fill-slate-900"
            >
              <p>매칭 평가가 반영되는 지표예요.</p>
              <p className="mt-1 text-slate-300">
                50%가 시작점이에요.
                <br />
                높을수록 좋은 인상을 준 것으로 볼 수 있어요.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <div className="relative overflow-hidden rounded-2xl bg-white border border-border shadow-sm p-5 sm:p-6">
            <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-xl bg-primary flex items-center justify-center mb-4">
                <Zap className="w-6 sm:w-7 h-6 sm:h-7 text-primary-foreground" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold mb-2">빠른 매칭</h2>
              <p className="text-muted-foreground text-sm mb-4">지금 바로 새로운 사람과 대화를 시작해보세요.</p>
              <Button onClick={() => setShowMatching(true)} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Zap className="w-4 h-4 mr-2" />
                매칭 시작하기
              </Button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-white border border-border shadow-sm p-5 sm:p-6">
            <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-secondary/20 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-xl bg-secondary flex items-center justify-center mb-4">
                <UserPlus className="w-6 sm:w-7 h-6 sm:h-7 text-secondary-foreground" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold mb-2">1:1 매칭</h2>
              <p className="text-muted-foreground text-sm mb-4">현재 온라인인 사람들에게 매칭 요청을 보내보세요!</p>
              <Button onClick={() => setShowOneOnOne(true)} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <UserPlus className="w-4 h-4 mr-2" />
                매칭 요청하기
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-border shadow-sm p-4 sm:p-6">
          <h3 className="font-semibold mb-2">소개팅 팁</h3>
          <p className="mb-4 text-xs sm:text-sm text-red-400">
            카메라 및 마이크 권한을 해제해야 매칭이 원활하게 진행되며, 권한이 막혀 있으면 매칭이 취소될 수 있습니다.
          </p>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium">1</span>
              </span>
              <span className="text-xs sm:text-sm">조명이 밝은 곳에서 참여하면 블러가 해제됐을 때 더 좋은 인상을 줄 수 있어요.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium">2</span>
              </span>
              <span className="text-xs sm:text-sm">어색할 때는 밸런스 게임 및 질문사전을 활용해보세요. 자연스럽게 대화가 이어져요.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium">3</span>
              </span>
              <span className="text-xs sm:text-sm">서로 동의해야 다음 라운드로 넘어가요. 부담 없이 대화를 즐겨보세요!</span>
            </li>
          </ul>
        </div>
      </div>

      <MatchingModal open={showMatching} onOpenChange={setShowMatching} onMatchFound={handleMatchFound} />
      <OneOnOneModal open={showOneOnOne} onOpenChange={setShowOneOnOne} onRequestChat={handleRequestChat} />

      <Dialog open={isWaitingModalOpen} onOpenChange={setIsWaitingModalOpen}>
        <DialogContent
          className="sm:max-w-md bg-background"
          showCloseButton={false}
          onPointerDownOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
        >
          <DialogTitle className="text-xl font-bold text-center">1:1 매칭 대기</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground text-center">
            상대 응답을 기다리는 중입니다.
          </DialogDescription>
          <div className="py-6 text-center">
            <div className="relative w-28 h-28 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <div className="absolute inset-4 rounded-full bg-card flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
            </div>
            <button
              type="button"
              className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
              onClick={() => setIsCameraTestOpen(true)}
            >
              <Camera className="w-4 h-4" />
              카메라 테스트하기
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <CameraTestModal
        open={isCameraTestOpen}
        onOpenChange={(open) => {
          if (!open) setIsCameraTestOpen(false)
          setIsCameraTestOpen(open)
        }}
        onReady={() => setIsCameraTestOpen(false)}
      />
    </>
  )
}
