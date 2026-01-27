"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Brain, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function FloatingTestButton() {
  const pathname = usePathname()
  const [isHovered, setIsHovered] = useState(false)
  
  // MBTI 페이지에서는 숨기기
  if (pathname === "/mbti") return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* 툴팁 */}
      <div
        className={cn(
          "px-4 py-2 bg-card rounded-full shadow-lg border border-border/50 transition-all duration-300 transform",
          isHovered 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 translate-y-2 pointer-events-none"
        )}
      >
        <p className="text-sm font-medium whitespace-nowrap">연애 가치관 테스트하러 가기 💖</p>
      </div>
      
      {/* 플로팅 버튼 */}
      <Link
        href="/mbti"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "group relative w-14 h-14 rounded-full shadow-lg transition-all duration-300",
          "bg-gradient-to-br from-violet-500 to-purple-600",
          "hover:from-violet-600 hover:to-purple-700",
          "hover:shadow-xl hover:shadow-purple-500/25",
          "hover:scale-110",
          "flex items-center justify-center",
          "animate-bounce-slow"
        )}
      >
        {/* 물결 효과 */}
        <span className="absolute inset-0 rounded-full bg-violet-400 opacity-0 group-hover:opacity-30 group-hover:animate-ping" />
        
        {/* 아이콘 */}
        <Brain className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110" />
        
        {/* 알림 뱃지 */}
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-[10px] text-white font-bold">!</span>
        </span>
      </Link>
    </div>
  )
}
