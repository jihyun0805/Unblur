"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { SessionRoom } from "@/components/session/session-room"

export default function SessionRoutePage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === "string" ? params.id : params.id?.[0] ?? ""
  const [showConfirmLeave, setShowConfirmLeave] = useState(false)

  // 브라우저 뒤로가기 이벤트 처리
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault()
      setShowConfirmLeave(true)
      // 뒤로가기를 막기 위해 다시 현재 페이지를 히스토리에 추가
      window.history.pushState(null, "", window.location.href)
    }

    // 히스토리 스택에 현재 상태 추가
    window.history.pushState(null, "", window.location.href)

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  const handleLeave = () => {
    router.push("/home")
  }

  const handleConfirmLeave = () => {
    setShowConfirmLeave(false)
    handleLeave()
  }

  const handleCancelLeave = () => {
    setShowConfirmLeave(false)
    // 뒤로가기를 취소했으므로 다시 현재 페이지를 히스토리에 추가
    window.history.pushState(null, "", window.location.href)
  }

  return (
    <SessionRoom 
      sessionId={id} 
      onLeave={handleLeave}
      externalShowEndConfirm={showConfirmLeave}
      onExternalConfirmLeave={handleConfirmLeave}
      onExternalCancelLeave={handleCancelLeave}
    />
  )
}
