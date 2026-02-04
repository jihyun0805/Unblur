"use client"

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react"
import { useRouter } from "next/navigation"

const SESSION_ID_KEY = "session_id"

function getInitialSessionId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(SESSION_ID_KEY) || null
}

interface SessionIdContextValue {
  sessionId: string | null
  setSessionId: (id: string | null) => void
  /** 세션 ID를 설정하고 /session으로 이동 (URL에 ID 노출 안 함) */
  enterSession: (id: string) => void
}

const SessionIdContext = createContext<SessionIdContextValue | null>(null)

export function SessionIdProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [sessionId, setSessionIdState] = useState<string | null>(getInitialSessionId)

  const setSessionId = useCallback((id: string | null) => {
    setSessionIdState(id)
    if (typeof window !== "undefined") {
      if (id) localStorage.setItem(SESSION_ID_KEY, id)
      else localStorage.removeItem(SESSION_ID_KEY)
    }
  }, [])

  const enterSession = useCallback(
    (id: string) => {
      setSessionId(id)
      router.push("/session")
    },
    [router, setSessionId],
  )

  const value = useMemo<SessionIdContextValue>(
    () => ({ sessionId, setSessionId, enterSession }),
    [sessionId, setSessionId, enterSession],
  )

  return <SessionIdContext.Provider value={value}>{children}</SessionIdContext.Provider>
}

export function useSessionId() {
  const ctx = useContext(SessionIdContext)
  if (!ctx) throw new Error("useSessionId must be used within SessionIdProvider")
  return ctx
}
