"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useMatchSse } from "@/contexts/match-sse-context"
import { useSessionId } from "@/contexts/session-id-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { CameraTestModal } from "@/components/matching/camera-test-modal"
import { UserProfileModal, type UserProfileData } from "@/components/common/user-profile-modal"
import { getAuthToken, resolveApiUrl } from "@/lib/api"
import * as matchApi from "@/lib/api/match"
import { isConflictError } from "@/lib/error-codes"
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
  const { enterSession } = useSessionId()
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [isCameraTestOpen, setIsCameraTestOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [requesterProfile, setRequesterProfile] = useState<UserProfileData | null>(null)
  const requestExpiresAtRef = useRef<number | null>(null)
  const requestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const REGION_CODE_TO_LABEL: Record<string, string> = {
    SEOUL: "서울",
    GYEONGGI: "경기",
    INCHEON: "인천",
    BUSAN: "부산",
    DAEGU: "대구",
    DAEJEON: "대전",
    GWANGJU: "광주",
    ULSAN: "울산",
    SEJONG: "세종",
    GANGWON: "강원",
    CHUNGBUK: "충북",
    CHUNGNAM: "충남",
    JEONBUK: "전북",
    JEONNAM: "전남",
    GYEONGBUK: "경북",
    GYEONGNAM: "경남",
    JEJU: "제주",
  }

  const mapRequesterProfile = (profile: {
    nickname?: string
    age?: number | null
    gender?: string | null
    region?: string | null
    mbti?: string | null
    intro?: string | null
    interestTags?: string[] | null
    clarityScore?: number | null
  }): UserProfileData => {
    const region = profile.region ? REGION_CODE_TO_LABEL[profile.region] || profile.region : ""
    return {
      nickname: profile.nickname ?? undefined,
      temperature: profile.clarityScore ?? 0,
      age: profile.age ?? undefined,
      gender: profile.gender ? profile.gender.toLowerCase() : undefined,
      region,
      mbti: profile.mbti ?? undefined,
      bio: profile.intro ?? undefined,
      interests: profile.interestTags ?? [],
    }
  }

  // 1:1 수락됨(요청자 측) → 세션으로 이동. pathname은 ref로 항상 최신값 사용(클로저 이슈 방지)
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname
  // 요청자: 상대가 거절함 → "매칭 취소, 세션 이동 안 함" 토스트
  useEffect(() => {
    const unsub = subscribe("one-on-one-declined", () => {
      showToast({
        title: "매칭 취소",
        description: "상대가 거절했습니다.",
        variant: "destructive",
      })
    })
    return unsub
  }, [subscribe, showToast])

  // 요청자/수신자: 시간 초과 → 모달 닫기 + 안내
  useEffect(() => {
    const unsub = subscribe("one-on-one-timeout", (data) => {
      const payload = data as { requestId?: string; request_id?: string } | undefined
      const requestId = payload?.requestId ?? payload?.request_id
      if (pendingRequestId && requestId && pendingRequestId !== requestId) return
      setIsRequestModalOpen(false)
      setPendingRequestId(null)
      showToast({
        title: "매칭 시간 초과",
        description: "다시 시도해주세요.",
        variant: "destructive",
      })
    })
    return unsub
  }, [subscribe, showToast, pendingRequestId])

  // 요청자: 상대가 수락함 → "세션방으로 이동합니다" 토스트 후 이동
  // disconnect() 시 skipServerNotify: true로 호출. closeMatchStream()(apiFetch)가 401이면 로그아웃 처리되므로
  // 이동 직전에는 로컬만 끊고, 세션 페이지 마운트 시 disconnect()에서 서버에 스트림 종료 알림.
  useEffect(() => {
    const unsub = subscribe("one-on-one-accepted", async (data) => {
      if (pathnameRef.current === "/session" || pathnameRef.current?.startsWith("/session/")) return
      const payload = data as { conferenceId?: string } | undefined
      const conferenceId = payload?.conferenceId ?? ACCEPTED_MATCH_SESSION_ID
      showToast({
        title: "매칭 수락됨",
        description: "세션방으로 이동합니다.",
      })
      disconnect({ skipServerNotify: true })
      enterSession(conferenceId)
    })
    return unsub
  }, [subscribe, disconnect, showToast, enterSession])

  useEffect(() => {
    const unsub = subscribe("one-on-one-requested", (data) => {
      const payload = data as {
        requestId?: string
        request_id?: string
        requesterProfile?: {
          nickname?: string
          age?: number | null
          gender?: string | null
          region?: string | null
          mbti?: string | null
          intro?: string | null
          interestTags?: string[] | null
          clarityScore?: number | null
        }
      }
      const requestId = payload?.requestId ?? payload?.request_id
      if (process.env.NODE_ENV === "development") {
        console.log("[MatchRequestToaster] one-on-one-requested 수신", {
          payload,
          requestId,
          pathname: pathnameRef.current,
        })
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

      setRequesterProfile(payload?.requesterProfile ? mapRequesterProfile(payload.requesterProfile) : null)

      setIsProfileOpen(false)
      setPendingRequestId(requestId)
      setIsRequestModalOpen(true)
    })
    return unsub
  }, [subscribe])

  // 새로고침 시 알림 1회 표시 (매칭 요청 수신 상태에서만 플래그 생성)
  useEffect(() => {
    if (typeof window === "undefined") return
    const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined
    const isReload = navEntry?.type === "reload"
    const flag = sessionStorage.getItem("one-on-one-request-reload-alert")
    if (isReload && flag) {
      sessionStorage.removeItem("one-on-one-request-reload-alert")
      window.alert("새로고침으로 인해 매칭이 거절되었습니다.")
    }
  }, [])

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

  // 새로고침/탭 닫기 시 거절 처리 + 리로드 알림 플래그 저장 (토큰 포함해 서버에 거절 반영)
  useEffect(() => {
    if (!isRequestModalOpen || !pendingRequestId) return
    const handleBeforeUnload = () => {
      sessionStorage.setItem("one-on-one-request-reload-alert", "1")
      const token = getAuthToken()
      const url = resolveApiUrl(`/api/v1/match/one-on-one/${encodeURIComponent(pendingRequestId)}/decline`)
      const headers: HeadersInit = { "Content-Type": "application/json" }
      if (token) headers["Authorization"] = `Bearer ${token}`
      fetch(url, {
        method: "POST",
        credentials: "include",
        keepalive: true,
        headers,
      }).catch((err) => {
        console.warn("[MatchRequestToaster] beforeunload 요청 실패", err)
      })
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isRequestModalOpen, pendingRequestId])

  // 30초 내 수락 제한 (타이머는 사용자에게 노출하지 않음)
  useEffect(() => {
    if (!isRequestModalOpen || !pendingRequestId) return
    if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current)
    requestExpiresAtRef.current = Date.now() + 30_000
    requestTimeoutRef.current = setTimeout(() => {
      requestExpiresAtRef.current = null
      requestTimeoutRef.current = null
      matchApi
        .declineOneOnOne(pendingRequestId)
        .then(() => {
          setIsRequestModalOpen(false)
          setPendingRequestId(null)
          showToast({
            title: "매칭 시간 초과",
            description: "다시 시도해주세요.",
            variant: "destructive",
          })
        })
        .catch((err) => {
          if (isConflictError(err)) {
            setIsRequestModalOpen(false)
            setPendingRequestId(null)
            return
          }
          showToast({
            title: "매칭 취소 실패",
            description: err instanceof Error ? err.message : "시간 초과 처리에 실패했습니다.",
            variant: "destructive",
          })
        })
    }, 30_000)
    return () => {
      if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current)
      requestTimeoutRef.current = null
      requestExpiresAtRef.current = null
    }
  }, [isRequestModalOpen, pendingRequestId, showToast])

  const handleAccept = async () => {
    if (!pendingRequestId) return
    if (requestExpiresAtRef.current && Date.now() > requestExpiresAtRef.current) {
      showToast({
        title: "매칭 시간 초과",
        description: "다시 시도해주세요.",
        variant: "destructive",
      })
      return
    }
    try {
      if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current)
      requestTimeoutRef.current = null
      requestExpiresAtRef.current = null
      const res = await matchApi.acceptOneOnOne(pendingRequestId)
      setIsRequestModalOpen(false)
      setPendingRequestId(null)
      showToast({
        title: "매칭 수락됨",
        description: "세션방으로 이동합니다.",
      })
      const conferenceId = res.conferenceId ?? ACCEPTED_MATCH_SESSION_ID
      disconnect({ skipServerNotify: true })
      enterSession(conferenceId)
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
      if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current)
      requestTimeoutRef.current = null
      requestExpiresAtRef.current = null
      await matchApi.declineOneOnOne(pendingRequestId)
      setIsRequestModalOpen(false)
      setPendingRequestId(null)
      showToast({
        title: "매칭 취소",
        description: "요청을 거절했습니다.",
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
            <span>
              {requesterProfile?.nickname ? `${requesterProfile.nickname}님이` : "상대방이"} 매칭을 요청했어요.
            </span>{" "}
            <button
              type="button"
              className="text-xs text-primary underline underline-offset-2 hover:text-primary/80"
              onClick={() => {
                if (!requesterProfile) {
                  showToast({
                    title: "프로필 확인 불가",
                    description: "요청자 정보를 불러오지 못했습니다.",
                    variant: "destructive",
                  })
                  return
                }
                setIsProfileOpen(true)
              }}
            >
              프로필 확인하기
            </button>
          </DialogDescription>
          <div className="mt-6 space-y-3">
            <Button
              onClick={() => setIsCameraTestOpen(true)}
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
          </div>
        </DialogContent>
      </Dialog>

      <CameraTestModal
        open={isCameraTestOpen}
        onOpenChange={(open) => {
          if (!open) setIsCameraTestOpen(false)
          setIsCameraTestOpen(open)
        }}
        onReady={() => {
          setIsCameraTestOpen(false)
          void handleAccept()
        }}
      />

      {requesterProfile && (
        <UserProfileModal
          open={isProfileOpen}
          onOpenChange={setIsProfileOpen}
          profile={requesterProfile}
        />
      )}
    </>
  )
}
