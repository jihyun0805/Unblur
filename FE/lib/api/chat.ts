import { apiFetch, resolveApiUrl } from "@/lib/api"
import type {
  BaseResponse,
  ChatMessagePageResponseDto,
  ChatMessageResponseDto,
  ChatReadEventDto,
  ChatSendRequestDto,
  ChatReadRequestDto,
} from "@/lib/chat-types"

/**
 * 채팅 메시지 목록 조회
 * @param conferenceId 컨퍼런스 ID
 * @param page 페이지 번호 (0부터 시작)
 * @param size 페이지 크기
 * @returns 메시지 페이지 응답
 */
export async function getChatMessages(
  conferenceId: string,
  page: number = 0,
  size: number = 100
): Promise<ChatMessagePageResponseDto> {
  const response = await apiFetch(
    `/api/v1/conferences/${conferenceId}/messages?page=${page}&size=${size}&sort=createdAt,desc`
  )

  const baseResponse: BaseResponse<ChatMessagePageResponseDto> = await response.json()

  if (!baseResponse.isSuccess || !baseResponse.data) {
    throw new Error(baseResponse.message || "메시지 조회에 실패했습니다")
  }

  return baseResponse.data
}

/**
 * 채팅 메시지 전송
 * @param conferenceId 컨퍼런스 ID
 * @param content 메시지 내용
 * @returns 전송된 메시지 응답
 */
export async function sendChatMessage(
  conferenceId: string,
  content: string
): Promise<ChatMessageResponseDto> {
  const request: ChatSendRequestDto = { content }

  const response = await apiFetch(`/api/v1/conferences/${conferenceId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  })

  const baseResponse: BaseResponse<ChatMessageResponseDto> = await response.json()

  if (!baseResponse.isSuccess || !baseResponse.data) {
    throw new Error(baseResponse.message || "메시지 전송에 실패했습니다")
  }

  return baseResponse.data
}

/**
 * 채팅 읽음 처리
 * @param conferenceId 컨퍼런스 ID
 * @param lastReadAt 마지막 읽은 시각 (ISO 8601 형식 또는 null)
 * @returns 읽음 이벤트 응답
 */
export async function markAsRead(
  conferenceId: string,
  lastReadAt: string | null
): Promise<ChatReadEventDto> {
  const request: ChatReadRequestDto = { lastReadAt }

  const response = await apiFetch(`/api/v1/conferences/${conferenceId}/read`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  })

  const baseResponse: BaseResponse<ChatReadEventDto> = await response.json()

  if (!baseResponse.isSuccess || !baseResponse.data) {
    throw new Error(baseResponse.message || "읽음 처리에 실패했습니다")
  }

  return baseResponse.data
}
