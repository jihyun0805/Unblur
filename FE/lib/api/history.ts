import type { HistoryItem } from "@/lib/history-types"
import { apiFetch } from "@/lib/api"
import type { BaseResponse } from "@/lib/api/auth"

interface ConferenceHistorySummaryDto {
  totalMatches: number
  totalMinutes: number
  myClarityScore: number
}

interface ConferenceHistoryItemDto {
  conferenceId: string
  currentRound: number
  createdDate: string | null
  durationMinutes: number
  unreadCount: number
  userId: string | null
  nickname: string | null
  profileImageUrl: string | null
  clarityScore: number | null
  isOnline: boolean | null
  isBlocked: boolean | null
}

interface ConferenceHistoryResponseDto {
  summary: ConferenceHistorySummaryDto
  items: ConferenceHistoryItemDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface HistorySummaryData {
  totalMatches: number
  totalMinutes: number
  myClarityScore: number
}

export interface HistoryListResult {
  items: HistoryItem[]
  summary: HistorySummaryData
  page: number
  size: number
  totalElements: number
  totalPages: number
}

interface PartnerProfileResponseDto {
  nickname: string
  clarityScore: number
  age: number | null
  gender: string | null
  region: string | null
  mbti: string | null
  intro: string | null
  interestTags: string[]
  roundSummaries: Array<{
    roundNumber: number
    summaryText: string
  }>
}

const formatDate = (value: string | null): string => {
  if (!value) return "-"
  const [year, month, day] = value.split("-")
  if (!year || !month || !day) return value
  return `${year}.${month}.${day}`
}

const formatDuration = (minutes: number): string => {
  if (!Number.isFinite(minutes)) return "-"
  if (minutes < 60) return `${minutes}분`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (rest === 0) return `${hours}시간`
  return `${hours}시간 ${rest}분`
}

export async function getHistoryList(page: number, size: number): Promise<HistoryListResult> {
  const response = await apiFetch(`/api/v1/history?page=${page}&size=${size}`)
  const baseResponse: BaseResponse<ConferenceHistoryResponseDto> = await response.json()
  if (!baseResponse.isSuccess) {
    throw new Error(baseResponse.message || baseResponse.errorCode || "이력 조회에 실패했습니다.")
  }

  const data = baseResponse.data
  return {
    items: data.items.map((item) => ({
      id: item.conferenceId,
      partnerId: item.userId ?? undefined,
      date: formatDate(item.createdDate),
      partnerNickname: item.nickname ?? "-",
      duration: formatDuration(item.durationMinutes),
      rounds: item.currentRound ?? 0,
      partnerTemp: item.clarityScore ?? 0,
      isOnline: item.isOnline ?? false,
      isBlocked: item.isBlocked ?? false,
    })),
    summary: {
      totalMatches: data.summary.totalMatches,
      totalMinutes: data.summary.totalMinutes,
      myClarityScore: data.summary.myClarityScore,
    },
    page: data.page,
    size: data.size,
    totalElements: data.totalElements,
    totalPages: data.totalPages,
  }
}

export async function getPartnerProfile(conferenceId: string): Promise<PartnerProfileResponseDto> {
  const response = await apiFetch(`/api/v1/history/${encodeURIComponent(conferenceId)}/partner`)
  const baseResponse: BaseResponse<PartnerProfileResponseDto> = await response.json()
  if (!baseResponse.isSuccess) {
    throw new Error(baseResponse.message || baseResponse.errorCode || "상대 프로필 조회에 실패했습니다.")
  }
  return baseResponse.data
}

export async function blockPartner(id: string): Promise<void> {
  const response = await apiFetch(`/api/v1/users/${encodeURIComponent(id)}/block`, {
    method: "POST",
  })

  const baseResponse: BaseResponse<null> = await response.json()
  if (!baseResponse.isSuccess) {
    throw new Error(baseResponse.message || baseResponse.errorCode || "사용자 차단에 실패했습니다.")
  }
}

export async function unblockPartner(id: string): Promise<void> {
  const response = await apiFetch(`/api/v1/users/${encodeURIComponent(id)}/block`, {
    method: "DELETE",
  })

  const baseResponse: BaseResponse<null> = await response.json()
  if (!baseResponse.isSuccess) {
    throw new Error(baseResponse.message || baseResponse.errorCode || "사용자 차단 해제에 실패했습니다.")
  }
}
