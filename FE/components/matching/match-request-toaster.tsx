"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useMatchSse } from "@/contexts/match-sse-context"
import { Button } from "@/components/ui/button"
import { ToastAction } from "@/components/ui/toast"
import * as matchApi from "@/lib/api/match"

const { ACCEPTED_MATCH_SESSION_ID } = matchApi

/**
 * 사이트 접속 중(세션 제외) 어디서든 1:1 매칭 요청이 들어오면 토스트로 표시.
 * 수락/거절 버튼으로 응답. 수락 시(수락자·요청자 모두) 고정 세션 ID로 이동.
 */
export function MatchRequestToaster() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast: showToast } = useToast()
  const { subscribe, disconnect } = useMatchSse()

  // 1:1 수락됨(요청자 측) → 세션으로 이동. pathname은 ref로 항상 최신값 사용(클로저 이슈 방지)
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname
  // 요청자: 상대가 거절함 → "매칭 취소, 세션 이동 안 함" 토스트
  useEffect(() => {
    const unsub = subscribe("one-on-one-declined", () => {
      showToast({
        title: "상대방이 거절했습니다",
        description: "매칭이 취소되었으며 세션으로 이동하지 않습니다.",
        variant: "destructive",
      })
    })
    return unsub
  }, [subscribe, showToast])

  // 요청자: 상대가 수락함 → "세션방으로 이동합니다" 토스트 후 이동
  useEffect(() => {
    const unsub = subscribe("one-on-one-accepted", async (data) => {
      if (pathnameRef.current?.startsWith("/session")) return
      const payload = data as { conferenceId?: string } | undefined
      const conferenceId = payload?.conferenceId ?? ACCEPTED_MATCH_SESSION_ID
      showToast({
        title: "매칭 수락됨",
        description: "세션방으로 이동합니다.",
      })
      await disconnect()
      router.push(`/session/${conferenceId}`)
    })
    return unsub
  }, [subscribe, disconnect, showToast, router])

  useEffect(() => {
    const unsub = subscribe("one-on-one-requested", (data) => {
      const payload = data as { requestId?: string; request_id?: string }
      const requestId = payload?.requestId ?? payload?.request_id
      if (process.env.NODE_ENV === "development") {
        console.log("[MatchRequestToaster] one-on-one-requested 수신", { payload, requestId, pathname: pathnameRef.current })
      }
      if (!requestId) {
        if (process.env.NODE_ENV === "development") console.warn("[MatchRequestToaster] requestId 없음, 토스트 스킵")
        return
      }

      // 세션 중에는 토스트 표시하지 않음 (항상 최신 pathname 사용)
      if (pathnameRef.current?.startsWith("/session")) {
        if (process.env.NODE_ENV === "development") console.log("[MatchRequestToaster] 세션 페이지라 토스트 스킵")
        return
      }

      const isConflictError = (err: unknown) =>
        err instanceof Error && err.message?.includes("API_ERROR_409")

      const t = showToast({
        title: "1:1 매칭 요청",
        description: "매칭 요청이 왔습니다. 수락하시겠습니까?",
      })

      t.update({
        id: t.id,
        action: (
          <>
            <ToastAction asChild altText="수락">
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={async () => {
                  try {
                    const res = await matchApi.acceptOneOnOne(requestId)
                    t.dismiss()
                    showToast({
                      title: "매칭 수락됨",
                      description: "세션방으로 이동합니다.",
                    })
                    const conferenceId = res.conferenceId ?? ACCEPTED_MATCH_SESSION_ID
                    await disconnect()
                    router.push(`/session/${conferenceId}`)
                  } catch (err) {
                    console.error("1:1 수락 실패:", err)
                    if (isConflictError(err)) {
                      t.dismiss()
                      return
                    }
                    showToast({
                      title: "수락 실패",
                      description: err instanceof Error ? err.message : "수락에 실패했습니다.",
                      variant: "destructive",
                    })
                  }
                }}
              >
                수락
              </Button>
            </ToastAction>
            <ToastAction asChild altText="거절">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    await matchApi.declineOneOnOne(requestId)
                    t.dismiss()
                    showToast({
                      title: "매칭 취소",
                      description: "세션으로 이동하지 않습니다.",
                    })
                  } catch (err) {
                    console.error("1:1 거절 실패:", err)
                    if (isConflictError(err)) {
                      t.dismiss()
                      return
                    }
                    showToast({
                      title: "거절 실패",
                      description: err instanceof Error ? err.message : "거절에 실패했습니다.",
                      variant: "destructive",
                    })
                  }
                }}
              >
                거절
              </Button>
            </ToastAction>
          </>
        ),
      })
    })
    return unsub
  }, [subscribe, showToast, router])

  return null
}
