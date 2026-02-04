"use client"

import { useEffect, useLayoutEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ErrorBoundary } from "react-error-boundary"
import { useAuth } from "@/contexts/auth-context"
import { useMatchSse } from "@/contexts/match-sse-context"
import { useSessionId } from "@/contexts/session-id-context"
import { useToast } from "@/hooks/use-toast"
import { BackgroundLayout } from "@/components/common/background-layout"
import { MainLayout } from "@/components/common/main-layout"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

function ErrorFallback({ error, resetErrorBoundary }: { error: unknown; resetErrorBoundary: () => void }) {
  const message = error instanceof Error ? error.message : "잠시 후 다시 시도해 주세요."
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4 max-w-sm">
        <p className="font-medium text-destructive">문제가 발생했어요</p>
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={resetErrorBoundary}>다시 시도</Button>
          <Button variant="outline" onClick={() => window.location.assign("/")}>
            홈으로
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function MainRouteLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth()
  const { disconnect } = useMatchSse()
  const { sessionId } = useSessionId()
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const isExactSession = pathname === "/session"
  const shouldRedirectSessionToHome = isExactSession && (sessionId === null || sessionId === "")

  useLayoutEffect(() => {
    if (shouldRedirectSessionToHome) router.replace("/home")
  }, [shouldRedirectSessionToHome, router])

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace("/")
      return
    }
  }, [user, isLoading, router])

  const isSessionRoom = pathname === "/session" || pathname?.startsWith("/session/")
  const isSessionOrMbti = isSessionRoom || pathname?.startsWith("/test")
  const hideFloatingTestButton = pathname?.startsWith("/history")
  const handleLogout = async () => {
    try {
      disconnect({ skipServerNotify: true })
      await logout()
      setShowLogoutConfirm(false)
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "pendingToast",
          JSON.stringify({
            title: "로그아웃 완료",
            description: "다음에 또 만나요!",
          }),
        )
      }
      router.replace("/")
    } catch (error) {
      console.error("로그아웃 실패:", error)
      toast({
        title: "로그아웃 실패",
        description: "로그아웃 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (shouldRedirectSessionToHome) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">홈으로 이동 중...</p>
      </div>
    )
  }

  return (
    <>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        {isSessionOrMbti ? (
          pathname?.startsWith("/test") ? <BackgroundLayout>{children}</BackgroundLayout> : children
        ) : (
          <MainLayout onLogout={() => setShowLogoutConfirm(true)} hideFloatingTestButton={hideFloatingTestButton}>
            {children}
          </MainLayout>
        )}
      </ErrorBoundary>

      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="sm:max-w-sm bg-background">
          <DialogHeader>
            <DialogTitle className="text-center">로그아웃</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="mb-6">정말 로그아웃하시겠습니까?</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowLogoutConfirm(false)} className="flex-1">
                취소
              </Button>
              <Button onClick={handleLogout} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                로그아웃
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
