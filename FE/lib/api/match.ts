import { apiFetch } from "@/lib/api"
import { ApiError } from "@/lib/error-codes"

const MATCH_BASE = "/api/v1/match"

/** BE MatchController 경로: /queue/{request_id}, /one-on-one/{request_id}/accept|decline */

/**
 * 매칭 SSE 스트림을 서버에서 종료한다.
 * 401(이미 끊김/비인증 등)이 나와도 로그아웃하지 않음.
 */
export async function closeMatchStream(): Promise<void> {
  const response = await apiFetch(`${MATCH_BASE}/stream`, {
    method: "DELETE",
    skipAuthClearOn401: true,
  })
  if (!response.ok) {
    return
  }
}

/** 1:1 수락 시 conferenceId가 없을 때만 사용하는 폴백 세션 ID */
export const ACCEPTED_MATCH_SESSION_ID = "550e8400-e29b-41d4-a716-446655440000"

/** 공통 API 응답 (BE BaseResponse) */
export interface BaseResponse<T> {
  isSuccess: boolean
  statusCode: number
  message: string
  data: T | null
  errorCode?: string
}

/** 빠른 매칭 요청 */
export interface FastMatchingRequest {
  filters?: Record<string, unknown>
}

/** 매칭 대기열 응답 */
export interface MatchingQueueResponse {
  requestId: string
  status: string
  isQueued: boolean
  position: number | null
  estimatedWaitSeconds: number | null
  queueType: string
  waitingCount: number
  queuedAt: string
}

/** 1:1 매칭 요청 */
export interface OneOnOneMatchRequest {
  targetUserId: string
}

/** 1:1 매칭 응답 */
export interface OneOnOneMatchResponse {
  requestId: string
  status: string
  queueType: string
  targetUserId: string
  targetStatus: string
  estimatedWaitSeconds: number | null
  queuedAt: string
  /** 세션(컨퍼런스) ID, 수락 시에만 존재 */
  conferenceId?: string
}

async function parseMatchResponse<T>(response: Response): Promise<T> {
  const base: BaseResponse<T> = await response.json()
  if (!base.isSuccess || base.data === undefined) {
    const msg = base.message || "요청에 실패했습니다."
    throw new ApiError(base.errorCode ?? "COMMON-002", msg, base.statusCode)
  }
  return base.data as T
}

/**
 * 빠른 매칭 시작
 */
export async function startQuickMatch(
  filters?: FastMatchingRequest["filters"]
): Promise<MatchingQueueResponse> {
  const response = await apiFetch(`${MATCH_BASE}/quick`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filters: filters ?? {} }),
  })
  return parseMatchResponse<MatchingQueueResponse>(response)
}

/**
 * 매칭 대기 현황 조회
 */
export async function getQueueStatus(): Promise<MatchingQueueResponse> {
  const response = await apiFetch(`${MATCH_BASE}/queue/status`)
  return parseMatchResponse<MatchingQueueResponse>(response)
}

/**
 * 빠른 매칭 취소
 */
export async function cancelQuickMatch(requestId: string): Promise<void> {
  const response = await apiFetch(
    `${MATCH_BASE}/queue/${encodeURIComponent(requestId)}`,
    { method: "DELETE" }
  )
}

/**
 * 1:1 매칭 요청
 */
export async function startOneOnOneMatch(
  targetUserId: string
): Promise<OneOnOneMatchResponse> {
  const response = await apiFetch(`${MATCH_BASE}/one-on-one`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetUserId }),
  })
  return parseMatchResponse<OneOnOneMatchResponse>(response)
}

/**
 * 1:1 매칭 수락
 */
export async function acceptOneOnOne(
  requestId: string
): Promise<OneOnOneMatchResponse> {
  const response = await apiFetch(
    `${MATCH_BASE}/one-on-one/${encodeURIComponent(requestId)}/accept`,
    { method: "POST" }
  )
  return parseMatchResponse<OneOnOneMatchResponse>(response)
}

/**
 * 1:1 매칭 거절
 */
export async function declineOneOnOne(
  requestId: string
): Promise<OneOnOneMatchResponse> {
  const response = await apiFetch(
    `${MATCH_BASE}/one-on-one/${encodeURIComponent(requestId)}/decline`,
    { method: "POST" }
  )
  return parseMatchResponse<OneOnOneMatchResponse>(response)
}

/** 온라인 사용자 DTO (BE OnlineUserDto) */
export interface OnlineUserDto {
  id: string
  nickname: string
  age: number
  gender: string
  region: string
  mbti: string
  loveDna?: string
  intro: string | null
  interestTags: string[]
  clarityScore: number
}

/** 온라인 사용자 목록 응답 */
export interface OnlineUserListResponse {
  onlineUsers: OnlineUserDto[]
}

/**
 * 온라인 사용자 목록 조회 (1:1 매칭 모달용)
 * @param limit 조회 개수 (기본 10)
 */
export async function getOnlineUsers(limit = 10, loveDna?: string): Promise<OnlineUserListResponse> {
  const params = new URLSearchParams({ limit: String(limit) })
  if (loveDna) {
    params.set("loveDna", loveDna.toUpperCase())
  }
  const response = await apiFetch(`${MATCH_BASE}/online-users?${params}`)
  return parseMatchResponse<OnlineUserListResponse>(response)
}

export interface ClarityEvaluationRequest {
  score: number
}

export async function evaluateClarity(
  conferenceId: string,
  score: number
): Promise<void> {
  await apiFetch(
    `/api/v1/conferences/${encodeURIComponent(conferenceId)}/clarity-evaluations`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score } satisfies ClarityEvaluationRequest),
      skipAuthClearOn401: true, // 세션 종료 후 평가 시 401이 나와도 로그아웃하지 않음
    }
  )
}
