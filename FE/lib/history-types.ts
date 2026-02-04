export interface HistoryItem {
  id: string
  partnerId?: string
  date: string
  partnerNickname: string
  duration: string
  rounds: number
  roundSummaries?: (string | null)[]
  partnerTemp: number
  age?: number
  gender?: string
  region?: string
  birthDate?: string
  bio?: string
  mbti?: string
  loveDna?: string
  interests?: string[]
  isOnline: boolean
  isBlocked?: boolean
  /** 서버에 저장된 읽지 않은 메시지 수 (한 번 읽으면 계속 읽은 상태 유지) */
  unreadCount?: number
}
