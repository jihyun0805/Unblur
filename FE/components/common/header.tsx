"use client"

import { useState } from "react"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X, Brain, History, User, LogOut } from "lucide-react"

interface HeaderProps {
  // 로그인 후 네비게이션 콜백
  onHomeClick?: () => void
  onHistoryClick?: () => void
  onProfileClick?: () => void
  onMbtiClick?: () => void
  onLogout?: () => void
  currentView?: "home" | "history" | "profile" | "mbti"
  
  // 로그인 전 모달 제어
  onLoginClick?: () => void
  onRegisterClick?: () => void
}

export function Header({
  onHomeClick,
  onHistoryClick,
  onProfileClick,
  onMbtiClick,
  onLogout,
  currentView,
  onLoginClick,
  onRegisterClick,
}: HeaderProps) {
  const { user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogoClick = () => {
    if (user && onHomeClick) {
      onHomeClick()
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-md border-b border-border/30">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <button 
          onClick={handleLogoClick} 
          className="flex items-center gap-3"
          disabled={!user || !onHomeClick}
        >
          <Image 
            src="/logo.png" 
            alt="Unblur Logo" 
            width={40} 
            height={40} 
            className="object-contain" 
            style={{ 
              filter: 'brightness(0) saturate(100%) invert(25%) sepia(5%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(90%)' 
            }} 
          />
          <span className="font-bold text-xl text-foreground hidden sm:inline">
            Unblur
          </span>
        </button>

        {/* Desktop Navigation */}
        {user ? (
          // 로그인 후: 네비게이션 메뉴
          <>
            <nav className="hidden sm:flex items-center gap-2">
              <Button 
                variant={currentView === "mbti" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={onMbtiClick}
                className="group relative"
              >
                <Brain className="w-4 h-4" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  MBTI 테스트
                </span>
              </Button>
              <Button 
                variant={currentView === "history" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={onHistoryClick}
                className="group relative"
              >
                <History className="w-4 h-4" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  이력
                </span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onProfileClick}
                className="group relative"
              >
                <User className="w-4 h-4" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  프로필
                </span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onLogout}
                className="group relative"
              >
                <LogOut className="w-4 h-4" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  로그아웃
                </span>
              </Button>
            </nav>
          </>
        ) : (
          // 로그인 전: 로그인/시작하기 버튼
          <div className="hidden sm:flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={onLoginClick} 
              className="text-foreground"
            >
              로그인
            </Button>
            <Button
              onClick={onRegisterClick}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              시작하기
            </Button>
          </div>
        )}

        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="sm:hidden">
            <Button variant="ghost" size="icon">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64 bg-card/95 backdrop-blur-md">
            <nav className="flex flex-col gap-2 mt-8">
              {user ? (
                // 로그인 후 모바일 메뉴
                <>
                  <Button
                    variant={currentView === "mbti" ? "secondary" : "ghost"}
                    className="justify-start"
                    onClick={() => {
                      onMbtiClick?.()
                      setMobileMenuOpen(false)
                    }}
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    MBTI 테스트
                  </Button>
                  <Button
                    variant={currentView === "history" ? "secondary" : "ghost"}
                    className="justify-start"
                    onClick={() => {
                      onHistoryClick?.()
                      setMobileMenuOpen(false)
                    }}
                  >
                    <History className="w-4 h-4 mr-2" />
                    이력
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => {
                      onProfileClick?.()
                      setMobileMenuOpen(false)
                    }}
                  >
                    <User className="w-4 h-4 mr-2" />
                    프로필
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start text-destructive"
                    onClick={() => {
                      onLogout?.()
                      setMobileMenuOpen(false)
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    로그아웃
                  </Button>
                </>
              ) : (
                // 로그인 전 모바일 메뉴
                <>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => {
                      onLoginClick?.()
                      setMobileMenuOpen(false)
                    }}
                  >
                    로그인
                  </Button>
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => {
                      onRegisterClick?.()
                      setMobileMenuOpen(false)
                    }}
                  >
                    시작하기
                  </Button>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
