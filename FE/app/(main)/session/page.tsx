"use client"

import { useRouter } from "next/navigation"
import { useEffect, useLayoutEffect, useState } from "react"
import { SessionRoom } from "@/components/session/session-room"
import { useMatchSse } from "@/contexts/match-sse-context"
import { useSessionId } from "@/contexts/session-id-context"

const SESSION_ID_KEY = "session_id"

export default function SessionPage() {
  const router = useRouter()
  const { sessionId: id, setSessionId } = useSessionId()
  const [showConfirmLeave, setShowConfirmLeave] = useState(false)
  const { disconnect, reconnect } = useMatchSse()

  // id 없이 /session 접근 시 즉시 /home으로 (로그아웃 방지용으로 가능한 한 빨리 리다이렉트)
  useLayoutEffect(() => {
    if (id === null || id === "") {
      router.replace("/home")
    }
  }, [id, router])

  useEffect(() => {
    if (id === null || id === "") return
    void disconnect({ skipServerNotify: false })
    return () => {
      reconnect()
    }
  }, [id, disconnect, reconnect])

  const handleLeave = () => {
    setSessionId(null)
    router.replace("/home")
  }

  const handleInvalidOrEndedSession = () => {
    setSessionId(null)
    router.replace("/home")
  }

  useEffect(() => {
    if (id === null || id === "") return

    const handlePopState = () => {
      setShowConfirmLeave(true)
      window.history.pushState(null, "", window.location.href)
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      localStorage.removeItem(SESSION_ID_KEY)
      e.preventDefault()
      e.returnValue = " "
      return " "
    }

    window.history.pushState(null, "", window.location.href)
    window.addEventListener("popstate", handlePopState)
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("popstate", handlePopState)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [id])

  const handleConfirmLeave = () => {
    setShowConfirmLeave(false)
    handleLeave()
  }

  const handleCancelLeave = () => {
    setShowConfirmLeave(false)
    window.history.pushState(null, "", window.location.href)
  }

  if (id === null || id === "") {
    return null
  }

  return (
    <SessionRoom
      sessionId={id}
      onLeave={handleLeave}
      onInvalidOrEndedSession={handleInvalidOrEndedSession}
      externalShowEndConfirm={showConfirmLeave}
      onExternalConfirmLeave={handleConfirmLeave}
      onExternalCancelLeave={handleCancelLeave}
    />
  )
}
