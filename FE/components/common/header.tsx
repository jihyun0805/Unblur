"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X, Home, History, User, LogOut } from "lucide-react"

interface HeaderProps {
  onLogout?: () => void
  onLoginClick?: () => void
  onRegisterClick?: () => void
}

export function Header({ onLogout, onLoginClick, onRegisterClick }: HeaderProps) {
  const { user } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => pathname === path

  return (
    <header className="shrink-0 z-50 bg-transparent backdrop-blur-md border-b border-border/30">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        {user ? (
          <Link href="/home" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Unblur Logo"
              width={40}
              height={40}
              className="object-contain"
              style={{
                filter:
                  "brightness(0) saturate(100%) invert(25%) sepia(5%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(90%)",
              }}
            />
            <span className="font-bold text-xl text-foreground hidden sm:inline">Unblur</span>
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Unblur Logo"
              width={40}
              height={40}
              className="object-contain"
              style={{
                filter:
                  "brightness(0) saturate(100%) invert(25%) sepia(5%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(90%)",
              }}
            />
            <span className="font-bold text-xl text-foreground hidden sm:inline">Unblur</span>
          </div>
        )}

        {/* Desktop Navigation */}
        {user ? (
          <nav className="hidden sm:flex items-center gap-2">
            <Button variant={isActive("/home") ? "secondary" : "ghost"} size="sm" asChild className="group relative">
              <Link href="/home">
                <Home className="w-4 h-4" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  홈
                </span>
              </Link>
            </Button>
            <Button variant={isActive("/history") ? "secondary" : "ghost"} size="sm" asChild className="group relative">
              <Link href="/history">
                <History className="w-4 h-4" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  이력
                </span>
              </Link>
            </Button>
            <Button variant={isActive("/profile") ? "secondary" : "ghost"} size="sm" asChild className="group relative">
              <Link href="/profile">
                <User className="w-4 h-4" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  프로필
                </span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout} className="group relative">
              <LogOut className="w-4 h-4" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                로그아웃
              </span>
            </Button>
          </nav>
        ) : (
          <div className="hidden sm:flex items-center gap-3">
            <Button variant="ghost" onClick={onLoginClick} className="text-foreground hover:bg-sky-200/80">
              로그인
            </Button>
            <Button onClick={onRegisterClick} className="bg-transparent text-foreground hover:bg-sky-200/80">
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
                <>
                  <Button
                    variant={isActive("/home") ? "secondary" : "ghost"}
                    className="justify-start"
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href="/home">
                      <Home className="w-4 h-4 mr-2" />
                      홈
                    </Link>
                  </Button>
                  <Button
                    variant={isActive("/history") ? "secondary" : "ghost"}
                    className="justify-start"
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href="/history">
                      <History className="w-4 h-4 mr-2" />
                      이력
                    </Link>
                  </Button>
                  <Button
                    variant={isActive("/profile") ? "secondary" : "ghost"}
                    className="justify-start"
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href="/profile">
                      <User className="w-4 h-4 mr-2" />
                      프로필
                    </Link>
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
                <>
                  <Button
                    variant="ghost"
                    className="justify-start hover:bg-sky-200/80"
                    onClick={() => {
                      onLoginClick?.()
                      setMobileMenuOpen(false)
                    }}
                  >
                    로그인
                  </Button>
                  <Button
                    className="bg-transparent text-foreground hover:bg-sky-200/80"
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
