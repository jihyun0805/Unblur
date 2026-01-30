import type { HistoryItem } from "@/lib/history-types"
import { apiFetch } from "@/lib/api"
import type { BaseResponse } from "@/lib/api/auth"

const MOCK_HISTORY: HistoryItem[] = [
  {
    id: "1",
    date: "2024.01.14",
    partnerNickname: "커피러버",
    duration: "25분",
    rounds: 3,
    partnerTemp: 38.2,
    age: 28,
    gender: "female",
    region: "서울",
    birthDate: "1996.03.15",
    bio: "커피와 산책을 좋아해요",
    mbti: "ENFP",
  },
  {
    id: "2",
    date: "2024.01.13",
    partnerNickname: "여행가",
    duration: "15분",
    rounds: 2,
    partnerTemp: 35.8,
    age: 31,
    gender: "male",
    region: "부산",
    birthDate: "1993.07.22",
    bio: "돌아다니는 걸 좋아합니다",
    mbti: "ISTP",
  },
  { id: "3", date: "2024.01.12", partnerNickname: "음악덕후", duration: "35분", rounds: 4, partnerTemp: 39.1 },
  { id: "4", date: "2024.01.11", partnerNickname: "독서왕", duration: "10분", rounds: 2, partnerTemp: 36.5 },
  { id: "5", date: "2024.01.10", partnerNickname: "요리사", duration: "45분", rounds: 4, partnerTemp: 40.2 },
]

export async function getHistoryList(): Promise<HistoryItem[]> {
  return Promise.resolve([...MOCK_HISTORY])
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
