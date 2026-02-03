export interface HistoryItem {
  id: string
  partnerId?: string
  date: string
  partnerNickname: string
  duration: string
  rounds: number
  roundSummaries?: string[]
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
}
