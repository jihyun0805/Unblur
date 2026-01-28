"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { BackgroundLayout } from "@/components/common/background-layout"
import { MainLayout } from "@/components/common/main-layout"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function MainRouteLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace("/")
      return
    }
  }, [user, isLoading, router])

  const isSessionOrMbti = pathname?.startsWith("/session") || pathname?.startsWith("/test")
  const handleLogout = () => {
    logout()
    setShowLogoutConfirm(false)
    toast({ title: "로그아웃 완료", description: "다음에 또 만나요!" })
    router.replace("/")
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

  return (
    <>
      {isSessionOrMbti ? (
        pathname === "/test" ? (
          <BackgroundLayout>{children}</BackgroundLayout>
        ) : (
          children
        )
      ) : (
        <MainLayout onLogout={() => setShowLogoutConfirm(true)}>{children}</MainLayout>
      )}

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
