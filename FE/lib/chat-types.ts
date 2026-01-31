/**
 * 채팅 관련 TypeScript 타입 정의
 */

export interface BaseResponse<T> {
  isSuccess: boolean
  statusCode: number
  message: string
  data: T
  errorCode?: string
}

/**
 * 채팅 메시지 응답 DTO
 */
export interface ChatMessageResponseDto {
  messageId: string
  senderId: string | null
  senderNickname: string | null
  type: string // "USER" | "SYSTEM"
  content: string
  createdAt: string // ISO 8601 형식
  isReadByPartner: boolean
}

/**
 * 채팅 메시지 페이지 응답 DTO
 */
export interface ChatMessagePageResponseDto {
  items: ChatMessageResponseDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  conferenceStatus: string
}

/**
 * 채팅 읽음 이벤트 DTO
 */
export interface ChatReadEventDto {
  type: string // "SYSTEM"
  conferenceId: string
  readerId: string
  lastReadAt: string // ISO 8601 형식
}

/**
 * 채팅 메시지 전송 요청 DTO
 */
export interface ChatSendRequestDto {
  content: string
}

/**
 * 채팅 읽음 처리 요청 DTO
 */
export interface ChatReadRequestDto {
  lastReadAt: string | null // ISO 8601 형식 또는 null
}

/**
 * 프론트엔드 내부 사용 메시지 타입
 */
export interface ChatMessage {
  id: string
  senderId: string | null
  senderNickname: string | null
  type: "USER" | "SYSTEM"
  content: string
  createdAt: Date
  isReadByPartner: boolean
  isMine: boolean // 내가 보낸 메시지인지 여부
}
