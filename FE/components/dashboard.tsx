"use client"

import { DialogTitle } from "@/components/ui/dialog"
import { DialogHeader } from "@/components/ui/dialog"
import { DialogContent } from "@/components/ui/dialog"
import { Dialog } from "@/components/ui/dialog"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { MatchingModal } from "@/components/matching/matching-modal"
import { SessionRoom } from "@/components/session/session-room"
import { HistoryPage } from "@/components/history/history-page"
import { ProfilePage } from "@/components/profile/profile-page"
import { ProfileModal } from "@/components/profile/profile-modal"
import { Zap, Users, Thermometer, UserPlus } from "lucide-react"
import { MBTITestPage } from "@/components/mbti/mbti-test-page"
import { OneOnOneModal } from "@/components/matching/one-on-one-modal"
import { useToast } from "@/components/ui/use-toast"
import { Header } from "@/components/common/header"
import { BackgroundLayout } from "@/components/common/background-layout"

type View = "home" | "history" | "session" | "profile" | "mbti"

export function Dashboard() {
  const { user, logout } = useAuth()
  const [view, setView] = useState<View>("home")
  const [showMatching, setShowMatching] = useState(false)
  const [showOneOnOne, setShowOneOnOne] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showProfile, setShowProfile] = useState(false) // Declare setShowProfile variable
  const [currentSession, setCurrentSession] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Array<{ id: string; type: string; from: string }>>([])
  const { toast } = useToast()

  const handleMatchFound = (sessionId: string) => {
    setShowMatching(false)
    setCurrentSession(sessionId)
    setView("session")
  }

  const handleRequestChat = (userId: string) => {
    console.log("[v0] 1:1 채팅 요청:", userId)
    
    // 실제로는 서버로 요청을 보내고, 상대방이 수락하면 알림을 받음
    // 시뮬레이션: 5초 후 상대방이 수락하는 것으로 가정
    setTimeout(() => {
      const notification = {
        id: Date.now().toString(),
        type: "chat_accepted",
        from: "상대방",
      }
      setNotifications((prev) => [...prev, notification])
      
      toast({
        title: "1:1 채팅 수락!",
        description: "상대방이 채팅 요청을 수락했습니다. 채팅방으로 이동하시겠습니까?",
        action: (
          <Button
            size="sm"
            onClick={() => {
              // 채팅방으로 이동
              setCurrentSession(userId)
              setView("session")
            }}
          >
            입장하기
          </Button>
        ),
      })
    }, 5000)
  }

  const handleLeaveSession = () => {
    setCurrentSession(null)
    setView("home")
  }

  const handleNavigate = (newView: View) => {
    setView(newView)
  }

  if (view === "session" && currentSession) {
    return <SessionRoom sessionId={currentSession} onLeave={handleLeaveSession} />
  }

  if (view === "history") {
    return (
      <HistoryPage 
        onBack={() => setView("home")}
        onHomeClick={() => handleNavigate("home")}
        onHistoryClick={() => handleNavigate("history")}
        onProfileClick={() => handleNavigate("profile")}
        onMbtiClick={() => handleNavigate("mbti")}
        onLogout={() => setShowLogoutConfirm(true)}
      />
    )
  }

  if (view === "profile") {
    return (
      <ProfilePage 
        onBack={() => setView("home")}
        onHomeClick={() => handleNavigate("home")}
        onHistoryClick={() => handleNavigate("history")}
        onProfileClick={() => setShowProfile(true)}
        onMbtiClick={() => handleNavigate("mbti")}
        onLogout={() => setShowLogoutConfirm(true)}
      />
    )
  }

  if (view === "mbti") {
    return (
      <MBTITestPage 
        onBack={() => setView("home")} 
        onComplete={(mbti) => {
          // MBTI 테스트 완료 시 처리
          console.log("MBTI 결과:", mbti)
          setView("home")
        }}
      />
    )
  }

  const getTemperatureColor = (temp: number) => {
    if (temp >= 40) return "text-red-500"
    if (temp >= 38) return "text-orange-500"
    if (temp >= 36) return "text-green-500"
    if (temp >= 34) return "text-blue-500"
    return "text-blue-700"
  }

  return (
    <BackgroundLayout>
      <Header
        onLogout={() => setShowLogoutConfirm(true)}
        onProfileClick={() => handleNavigate("profile")}
        onHistoryClick={() => handleNavigate("history")}
        onHomeClick={() => handleNavigate("home")}
        onMbtiClick={() => handleNavigate("mbti")}
        currentView={view === "session" ? undefined : view}
      />

      <main className="pt-20 pb-10 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Welcome Section */}
            <div className="text-center mb-8 sm:mb-10">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">안녕하세요, {user?.nickname}님!</h1>
              <p className="text-muted-foreground text-sm sm:text-base">오늘도 특별한 만남이 기다리고 있어요.</p>
              <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-card">
                <Thermometer className={`w-4 h-4 ${getTemperatureColor(user?.temperature || 36.5)}`} />
                <span className={`font-semibold ${getTemperatureColor(user?.temperature || 36.5)}`}>
                  {user?.temperature?.toFixed(1) || "36.5"}°C
                </span>
                <span className="text-xs text-muted-foreground">매너 온도</span>
              </div>
            </div>

            {/* Matching Options - 2 Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
              {/* Quick Match Card */}
              <div className="relative overflow-hidden rounded-2xl bg-white border border-border shadow-sm p-5 sm:p-6">
                <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-xl bg-primary flex items-center justify-center mb-4">
                    <Zap className="w-6 sm:w-7 h-6 sm:h-7 text-primary-foreground" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold mb-2">빠른 매칭</h2>
                  <p className="text-muted-foreground text-sm mb-4">지금 바로 새로운 사람과 대화를 시작해보세요.</p>
                  <Button
                    onClick={() => setShowMatching(true)}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    매칭 시작하기
                  </Button>
                </div>
              </div>

              {/* 1:1 Chat Card */}
              <div className="relative overflow-hidden rounded-2xl bg-white border border-border shadow-sm p-5 sm:p-6">
                <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-secondary/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-xl bg-secondary flex items-center justify-center mb-4">
                    <UserPlus className="w-6 sm:w-7 h-6 sm:h-7 text-secondary-foreground" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold mb-2">1:1 채팅</h2>
                  <p className="text-muted-foreground text-sm mb-4">이전에 대화했던 사람과 다시 연결해보세요.</p>
                  <Button
                    onClick={() => setShowOneOnOne(true)}
                    className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    채팅 요청하기
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="rounded-2xl bg-white border border-border shadow-sm p-5 sm:p-6 mb-8 sm:mb-10">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-xl bg-secondary flex items-center justify-center">
                  <Users className="w-6 sm:w-7 h-6 sm:h-7 text-secondary-foreground" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">나의 활동</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">지금까지의 소개팅 기록</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="text-center p-3 sm:p-4 rounded-xl bg-secondary/20">
                  <p className="text-xl sm:text-2xl font-bold text-primary">12</p>
                  <p className="text-xs text-muted-foreground">총 매칭</p>
                </div>
                <div className="text-center p-3 sm:p-4 rounded-xl bg-secondary/20">
                  <p className="text-xl sm:text-2xl font-bold text-foreground">3.2h</p>
                  <p className="text-xs text-muted-foreground">총 대화</p>
                </div>
                <div className="text-center p-3 sm:p-4 rounded-xl bg-secondary/20">
                  <p className="text-xl sm:text-2xl font-bold text-orange-500">{user?.temperature?.toFixed(1) || "36.5"}°</p>
                  <p className="text-xs text-muted-foreground">매너온도</p>
                </div>
              </div>
            </div>

            {/* Online Status */}
            <div className="rounded-2xl bg-white border border-border shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
              {/* Online Status Content */}
            </div>

            {/* Tips */}
            <div className="rounded-2xl bg-white border border-border shadow-sm p-4 sm:p-6">
              <h3 className="font-semibold mb-4">소개팅 팁</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium">1</span>
                  </span>
                  <span className="text-xs sm:text-sm">
                    조명이 밝은 곳에서 참여하면 블러가 해제됐을 때 더 좋은 인상을 줄 수 있어요.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium">2</span>
                  </span>
                  <span className="text-xs sm:text-sm">
                    어색할 때는 밸런스 게임을 활용해보세요. 자연스럽게 대화가 이어져요.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium">3</span>
                  </span>
                  <span className="text-xs sm:text-sm">
                    서로 동의해야 다음 라운드로 넘어가요. 부담 없이 대화를 즐겨보세요!
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </main>

        <MatchingModal open={showMatching} onOpenChange={setShowMatching} onMatchFound={handleMatchFound} />
        <OneOnOneModal open={showOneOnOne} onOpenChange={setShowOneOnOne} onRequestChat={handleRequestChat} />
        <ProfileModal open={showProfile} onOpenChange={setShowProfile} /> {/* Add ProfileModal component */}
        
        {/* Logout Confirmation Dialog */}
        <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
          <DialogContent className="sm:max-w-sm bg-background">
            <DialogHeader>
              <DialogTitle className="text-center">로그아웃</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-center">
              <p className="mb-6">정말 로그아웃하시겠습니까?</p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={() => {
                    logout()
                    setShowLogoutConfirm(false)
                    toast({
                      title: "로그아웃 완료",
                      description: "다음에 또 만나요!",
                    })
                  }}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  로그아웃
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </BackgroundLayout>
  )
}

