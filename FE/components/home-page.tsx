"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { MatchingModal } from "@/components/matching/matching-modal"
import { OneOnOneModal } from "@/components/matching/one-on-one-modal"
import { CameraTestModal } from "@/components/matching/camera-test-modal"
import { Zap, UserPlus } from "lucide-react"

export function HomePage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [showMatching, setShowMatching] = useState(false)
  const [showOneOnOne, setShowOneOnOne] = useState(false)
  const [showCameraTest, setShowCameraTest] = useState(false)
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null)

  const handleMatchFound = (sessionId: string) => {
    setShowMatching(false)
    router.push(`/session/${sessionId}`)
  }

  const handleRequestChat = (userId: string) => {
    setTimeout(() => {
      toast({
        title: "1:1 채팅 수락!",
        description: "상대방이 채팅 요청을 수락했습니다. 채팅방으로 이동하시겠습니까?",
        action: (
          <Button
            size="sm"
            onClick={() => {
              setPendingSessionId(userId)
              setShowCameraTest(true)
            }}
          >
            입장하기
          </Button>
        ),
      })
    }, 5000)
  }

  const getTemperatureColor = (temp: number) => {
    if (temp >= 40) return "text-red-500"
    if (temp >= 38) return "text-orange-500"
    if (temp >= 36) return "text-green-500"
    if (temp >= 34) return "text-blue-500"
    return "text-blue-700"
  }

  const getClarityPercent = (temp: number) => {
    const percent = Math.round(((temp - 30) / 20) * 100)
    return Math.max(0, Math.min(100, percent))
  }

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">안녕하세요, {user?.nickname}님!</h1>
          <p className="text-muted-foreground text-sm sm:text-base">오늘도 특별한 만남이 기다리고 있어요.</p>
          <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-card">
            <span className={`font-semibold ${getTemperatureColor(user?.temperature || 36.5)}`}>
              {getClarityPercent(user?.temperature ?? 36.5)}%
            </span>
            <span className="text-xs text-muted-foreground">선명도</span>
          </div>
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
              <h2 className="text-lg sm:text-xl font-bold mb-2">1:1 채팅</h2>
              <p className="text-muted-foreground text-sm mb-4">이전에 대화했던 사람과 다시 연결해보세요.</p>
              <Button onClick={() => setShowOneOnOne(true)} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <UserPlus className="w-4 h-4 mr-2" />
                채팅 요청하기
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-border shadow-sm p-4 sm:p-6">
          <h3 className="font-semibold mb-4">소개팅 팁</h3>
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
              <span className="text-xs sm:text-sm">어색할 때는 밸런스 게임을 활용해보세요. 자연스럽게 대화가 이어져요.</span>
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
      <CameraTestModal
        open={showCameraTest}
        onOpenChange={setShowCameraTest}
        onReady={() => {
          if (pendingSessionId) {
            router.push(`/session/${pendingSessionId}`)
            setPendingSessionId(null)
          }
          setShowCameraTest(false)
        }}
      />
    </>
  )
}
