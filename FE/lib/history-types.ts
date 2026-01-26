export interface HistoryItem {
  id: string
  date: string
  partnerNickname: string
  duration: string
  rounds: number
  partnerTemp: number
  age?: number
  gender?: string
  region?: string
  birthDate?: string
  bio?: string
  mbti?: string
  interests?: string[]
}
