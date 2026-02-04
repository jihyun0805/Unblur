"use client"

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react"
import { getAuthToken, resolveApiUrl } from "@/lib/api"
import { closeMatchStream } from "@/lib/api/match"
import { useAuth } from "@/contexts/auth-context"

const MATCH_STREAM_URL = "/api/v1/match/stream"

/** SSE 이벤트 이름 (BE MatchEventType.eventName) */
export type MatchSseEventName =
  | "quick-match-waiting"
  | "quick-match-relaxed"
  | "quick-match-matched"
  | "quick-match-timeout"
  | "quick-match-canceled"
  | "one-on-one-requested"
  | "one-on-one-accepted"
  | "one-on-one-declined"
  | "one-on-one-canceled"
  | "one-on-one-timeout"
  | "round-ended"

/** 빠른 매칭 완료 페이로드 */
export interface QuickMatchResultPayload {
  requestId: string
  status: string
  queueType: string
  matchedUserId: string
  conferenceId: string
  matchedAt: string
}

/** 빠른 매칭 단계 페이로드 */
export interface QuickMatchStagePayload {
  requestId: string
  stage: string
  threshold: number
  occurredAt: string
}

type MatchSseCallback = (data: unknown) => void

interface MatchSseContextValue {
  /** 이벤트별 콜백 등록. 반환값으로 해제 */
  subscribe: (eventName: MatchSseEventName, callback: MatchSseCallback) => () => void
  isConnected: boolean
  /** SSE 연결 끊기. skipServerNotify=true면 로컬만(로그아웃 시 서버가 POST에서 해제). false/미지정이면 DELETE 호출 후 로컬 abort. */
  disconnect: (options?: { skipServerNotify?: boolean }) => void | Promise<void>
  /** SSE 재연결 (세션 퇴장 후 호출) */
  reconnect: () => void
}

const MatchSseContext = createContext<MatchSseContextValue | null>(null)

function parseSseEventBlock(block: string): { event?: string; data?: string } | null {
  let event: string | undefined
  const dataLines: string[] = []
  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith("event:")) event = line.slice(6).trim()
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim())
  }
  const data = dataLines.length > 0 ? dataLines.join("\n") : undefined
  if (!event && !data) return null
  return { event, data }
}

const RECONNECT_DELAY_MS = 2000
const MAX_RECONNECT_ATTEMPTS = 5

/** 컴포넌트 unmount(Strict Mode 등) 시 연결을 유지하기 위해 모듈 레벨로 보관. 여기서만 abort 시 실제 끊김. */
let sharedAbortController: AbortController | null = null
let sharedUserId: string | null = null

export function MatchSseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const handlersRef = useRef<Map<MatchSseEventName, Set<MatchSseCallback>>>(new Map())
  const abortRef = useRef<AbortController | null>(null)
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptRef = useRef(0)
  /** 로그아웃·세션 입장 등으로 수동 끊은 경우 true → 재연결하지 않음 */
  const skipConnectRef = useRef(false)
  /** 연결 시도 중이면 true (중복 연결/재시도 방지) */
  const connectingRef = useRef(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectTrigger, setConnectTrigger] = useState(0)
  /** 현재 마운트된 인스턴스에서 연결 상태를 반영하기 위한 setter (모듈에서 호출) */
  const setIsConnectedRef = useRef<((v: boolean) => void) | null>(null)
  setIsConnectedRef.current = setIsConnected

  const subscribe = useCallback(
    (eventName: MatchSseEventName, callback: MatchSseCallback) => {
      if (!handlersRef.current.has(eventName)) {
        handlersRef.current.set(eventName, new Set())
      }
      handlersRef.current.get(eventName)!.add(callback)
      return () => {
        handlersRef.current.get(eventName)?.delete(callback)
      }
    },
    []
  )

  const disconnect = useCallback((options?: { skipServerNotify?: boolean }) => {
    skipConnectRef.current = true
    if (delayRef.current) {
      clearTimeout(delayRef.current)
      delayRef.current = null
    }
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current)
      reconnectRef.current = null
    }
    reconnectAttemptRef.current = 0
    if (sharedAbortController) {
      sharedAbortController.abort()
      sharedAbortController = null
      sharedUserId = null
    }
    abortRef.current = null
    setIsConnected(false)
    setConnectTrigger((t) => t + 1)
    if (options?.skipServerNotify) return
    return closeMatchStream().catch((err) => {
      console.warn("[MatchSSE] closeMatchStream 실패", err)
    })
  }, [])

  const reconnect = useCallback(() => {
    skipConnectRef.current = false
    setConnectTrigger((t) => t + 1)
  }, [])

  useEffect(() => {
    if (!user) {
      skipConnectRef.current = false
      if (delayRef.current) {
        clearTimeout(delayRef.current)
        delayRef.current = null
      }
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current)
        reconnectRef.current = null
      }
      reconnectAttemptRef.current = 0
      if (sharedAbortController) {
        sharedAbortController.abort()
        sharedAbortController = null
        sharedUserId = null
      }
      abortRef.current = null
      setIsConnected(false)
      return
    }

    if (skipConnectRef.current) {
      return
    }

    // 이미 같은 사용자로 연결 중이면 재사용 (Strict Mode 리마운트 시 끊기지 않도록)
    if (sharedAbortController && sharedUserId === user.id) {
      abortRef.current = sharedAbortController
      setIsConnected(true)
      return
    }

    const token = getAuthToken()
    if (!token) return

    // 이미 연결 시도 중이면 이번 run은 스킵 (재시도 타이머가 다음에 트리거함)
    if (connectingRef.current) return
    connectingRef.current = true

    const url = resolveApiUrl(MATCH_STREAM_URL)
    let controller: AbortController | null = null

    const cleanup = () => {
      connectingRef.current = false
      if (controller) {
        controller.abort()
        controller = null
      }
      sharedAbortController = null
      sharedUserId = null
      abortRef.current = null
      setIsConnectedRef.current?.(false)
    }

    function scheduleReconnect() {
      if (reconnectRef.current) return
      if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) return
      reconnectAttemptRef.current += 1
      reconnectRef.current = setTimeout(() => {
        reconnectRef.current = null
        setConnectTrigger((t) => t + 1)
      }, RECONNECT_DELAY_MS)
    }

    async function doConnect(): Promise<void> {
      controller = new AbortController()
      abortRef.current = controller
      let buffer = ""

      try {
        const meUrl = resolveApiUrl("/api/v1/users/me")
        const preCheck = await fetch(meUrl, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
          signal: controller.signal,
        })
        if (!preCheck.ok) {
          cleanup()
          scheduleReconnect()
          return
        }

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "text/event-stream",
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
          credentials: "include",
        })

        if (!response.ok || !response.body) {
          cleanup()
          scheduleReconnect()
          return
        }

        reconnectAttemptRef.current = 0
        sharedAbortController = controller
        sharedUserId = user?.id ?? null
        setIsConnected(true)

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split(/\r?\n\r?\n/)
          buffer = parts.pop() ?? ""

          for (const block of parts) {
            const ev = parseSseEventBlock(block)
            if (!ev?.event) continue
            const callbacks = handlersRef.current.get(ev.event as MatchSseEventName)
            if (process.env.NODE_ENV === "development" && (ev.event === "one-on-one-requested" || ev.event === "one-on-one-accepted")) {
              console.log("[MatchSSE] event received", ev.event, "callbacks count", callbacks?.size ?? 0, "data preview", ev.data?.slice(0, 200))
            }
            if (!callbacks?.size) continue
            let data: unknown = null
            if (ev.data) {
              try {
                data = JSON.parse(ev.data)
              } catch (e) {
                if (process.env.NODE_ENV === "development") console.warn("[MatchSSE] JSON parse fail", ev.data?.slice(0, 100), e)
                data = ev.data
              }
            }
            callbacks.forEach((cb) => {
              try {
                cb(data)
              } catch (err) {
                console.error("[MatchSSE] callback error:", err)
              }
            })
          }
        }
        if (!controller?.signal.aborted) {
          scheduleReconnect()
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return
        const msg = (err as Error)?.message ?? ""
        const isExpectedClose =
          msg.includes("network error") ||
          msg.includes("ERR_INCOMPLETE_CHUNKED_ENCODING") ||
          msg.includes("chunked")
        if (isExpectedClose && process.env.NODE_ENV === "development") {
          console.warn("[MatchSSE] stream closed:", msg)
        } else if (!isExpectedClose) {
          console.error("[MatchSSE] stream error:", err)
        }
        scheduleReconnect()
      } finally {
        cleanup()
      }
    }

    const SSE_CONNECT_DELAY_MS = 200
    delayRef.current = setTimeout(() => {
      delayRef.current = null
      doConnect()
    }, SSE_CONNECT_DELAY_MS)

    return () => {
      if (delayRef.current) {
        clearTimeout(delayRef.current)
        delayRef.current = null
        connectingRef.current = false
      }
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current)
        reconnectRef.current = null
      }
      // unmount 시에는 연결 유지 (Strict Mode·라우트 전환 시 끊기지 않도록). user null / disconnect() 시에만 끊음.
    }
    // 로그인된 사용자는 경로와 관계없이 스트림 연결 (skipConnectRef 시에는 연결 안 함)
  }, [user?.id, connectTrigger])

  // 로그인됐는데 연결이 없으면 주기적으로 재시도 (새로고침·타이밍 대응). 세션 페이지면 skipConnectRef로 차단됨.
  const RETRY_INTERVAL_MS = 2000
  const MAX_RETRY_ATTEMPTS = 20
  useEffect(() => {
    if (!user || isConnected) return
    let attempts = 0
    const id = setInterval(() => {
      attempts += 1
      if (attempts > MAX_RETRY_ATTEMPTS) {
        clearInterval(id)
        return
      }
      if (skipConnectRef.current) return
      setConnectTrigger((prev) => prev + 1)
    }, RETRY_INTERVAL_MS)
    return () => clearInterval(id)
  }, [user?.id, isConnected])

  const contextValue = useMemo<MatchSseContextValue>(
    () => ({
      subscribe,
      isConnected,
      disconnect,
      reconnect,
    }),
    [subscribe, isConnected, disconnect, reconnect]
  )

  return (
    <MatchSseContext.Provider value={contextValue}>
      {children}
    </MatchSseContext.Provider>
  )
}

export function useMatchSse() {
  const ctx = useContext(MatchSseContext)
  if (!ctx) {
    throw new Error("useMatchSse must be used within MatchSseProvider")
  }
  return ctx
}
