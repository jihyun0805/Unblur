"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useMatchSse } from "@/contexts/match-sse-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { CameraTestModal } from "@/components/matching/camera-test-modal"
import * as matchApi from "@/lib/api/match"
import { Camera } from "lucide-react"

const { ACCEPTED_MATCH_SESSION_ID } = matchApi

/**
 * 사이트 접속 중(세션 제외) 어디서든 1:1 매칭 요청이 들어오면 모달로 표시.
 * 수락/거절은 강제 선택, 카메라 테스트는 매칭 유지 상태로 열림.
 */
export function MatchRequestToaster() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast: showToast } = useToast()
  const { subscribe, disconnect } = useMatchSse()
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [isCameraTestOpen, setIsCameraTestOpen] = useState(false)

  const isConflictError = (err: unknown) =>
    err instanceof Error && err.message?.includes("API_ERROR_409")

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
        if (process.env.NODE_ENV === "development") console.warn("[MatchRequestToaster] requestId 없음, 모달 스킵")
        return
      }

      // 세션 중에는 모달 표시하지 않음 (항상 최신 pathname 사용)
      if (pathnameRef.current?.startsWith("/session")) {
        if (process.env.NODE_ENV === "development") console.log("[MatchRequestToaster] 세션 페이지라 모달 스킵")
        return
      }

      setPendingRequestId(requestId)
      setIsRequestModalOpen(true)
    })
    return unsub
  }, [subscribe])

  // 뒤로가기 차단 (모달 열린 동안)
  useEffect(() => {
    if (!isRequestModalOpen) return
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault()
      window.history.pushState(null, "", window.location.href)
    }
    window.history.pushState(null, "", window.location.href)
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [isRequestModalOpen])

  const handleAccept = async () => {
    if (!pendingRequestId) return
    try {
      const res = await matchApi.acceptOneOnOne(pendingRequestId)
      setIsRequestModalOpen(false)
      setPendingRequestId(null)
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
        setIsRequestModalOpen(false)
        setPendingRequestId(null)
        return
      }
      showToast({
        title: "수락 실패",
        description: err instanceof Error ? err.message : "수락에 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  const handleDecline = async () => {
    if (!pendingRequestId) return
    try {
      await matchApi.declineOneOnOne(pendingRequestId)
      setIsRequestModalOpen(false)
      setPendingRequestId(null)
      showToast({
        title: "매칭 취소",
        description: "세션으로 이동하지 않습니다.",
      })
    } catch (err) {
      console.error("1:1 거절 실패:", err)
      if (isConflictError(err)) {
        setIsRequestModalOpen(false)
        setPendingRequestId(null)
        return
      }
      showToast({
        title: "거절 실패",
        description: err instanceof Error ? err.message : "거절에 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Dialog open={isRequestModalOpen}>
        <DialogContent
          className="sm:max-w-md bg-background"
          showCloseButton={false}
          onPointerDownOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
        >
          <DialogTitle className="text-xl font-bold text-center">1:1 매칭 요청</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground text-center">
            상대방이 매칭을 요청했어요. 수락하거나 거절해주세요.
          </DialogDescription>
          <div className="mt-6 space-y-3">
            <Button
              onClick={handleAccept}
              className="w-full py-6 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              수락하기
            </Button>
            <Button
              variant="outline"
              onClick={handleDecline}
              className="w-full py-6"
            >
              거절하기
            </Button>
            <button
              type="button"
              className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
              onClick={() => setIsCameraTestOpen(true)}
            >
              <Camera className="w-4 h-4" />
              카메라 테스트하기
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <CameraTestModal
        open={isCameraTestOpen}
        onOpenChange={(open) => {
          if (!open) setIsCameraTestOpen(false)
          setIsCameraTestOpen(open)
        }}
        onReady={() => setIsCameraTestOpen(false)}
      />
    </>
  )
}
