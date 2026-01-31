import { apiFetch } from "@/lib/api"
import { convertSurveyDataToDetailedInfo } from "@/lib/api/auth"
import type { BaseResponse } from "@/lib/api/auth"
import type { SurveyData, User } from "@/contexts/auth-context"

interface UserProfileResponseDto {
  id: string
  email: string
  nickname: string
  age: number | null
  birthDate: string | null
  gender: "MALE" | "FEMALE" | null
  region: string | null
  mbti: string | null
  intro: string | null
  detailedInfo: Array<Record<string, unknown>> | null
  interestTags: string[] | null
  clarityScore: number | null
}

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

const REGION_LABEL_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(REGION_CODE_TO_LABEL).map(([code, label]) => [label, code])
)

const mapDetailedInfoToSurveyData = (detailedInfo?: Array<Record<string, unknown>> | null): SurveyData => {
  if (!detailedInfo) return {}
  const survey: SurveyData = {}

  for (const item of detailedInfo) {
    const questionId = item.QuestionId
    const answer = item.Answer
    if (typeof questionId !== "string") continue

    switch (questionId) {
      case "dateStyle":
      case "contactStyle":
      case "conflictStyle":
      case "spending":
      case "priority":
      case "distancePreference":
      case "smokingSelf":
      case "smokingPartner":
      case "drinkingSelf":
      case "drinkingPartner":
      case "religionSelf":
      case "religionPartner":
      case "petSelf":
      case "petPartner":
        if (typeof answer === "string") {
          survey[questionId] = answer
        }
        break
      case "agePreference":
        if (Array.isArray(answer)) {
          survey.agePreference = answer.filter((value) => typeof value === "string") as string[]
        }
        break
      default:
        break
    }
  }

  return survey
}

const mapProfileToUser = (profile: UserProfileResponseDto): User => {
  const surveyData = mapDetailedInfoToSurveyData(profile.detailedInfo)
  if (profile.interestTags) {
    surveyData.interests = profile.interestTags
  }

  return {
    id: profile.id,
    email: profile.email,
    nickname: profile.nickname,
    age: profile.age ?? 0,
    gender: profile.gender === "MALE" ? "male" : "female",
    region: profile.region ? REGION_CODE_TO_LABEL[profile.region] || profile.region : "",
    birthDate: profile.birthDate || undefined,
    bio: profile.intro || undefined,
    mbti: profile.mbti || undefined,
    temperature: profile.clarityScore ?? 0,
    surveyData,
  }
}

export async function getMyProfile(): Promise<User> {
  const response = await apiFetch("/api/v1/users/me")
  const baseResponse: BaseResponse<UserProfileResponseDto> = await response.json()

  if (!baseResponse.isSuccess || !baseResponse.data) {
    throw new Error(baseResponse.message || baseResponse.errorCode || "프로필 조회에 실패했습니다.")
  }

  return mapProfileToUser(baseResponse.data)
}

export interface UpdateMyProfileInput {
  nickname?: string
  birthDate?: string
  gender?: "male" | "female"
  region?: string
  mbti?: string
  intro?: string
  interestTags?: string[]
}

export async function updateMyProfile(input: UpdateMyProfileInput): Promise<User> {
  const payload: Record<string, unknown> = {}

  if (input.nickname && input.nickname.trim().length > 0) {
    payload.nickname = input.nickname.trim()
  }

  if (input.birthDate) {
    payload.birthDate = input.birthDate
  }

  if (input.gender) {
    payload.gender = input.gender === "male" ? "MALE" : "FEMALE"
  }

  if (input.region) {
    payload.region = REGION_LABEL_TO_CODE[input.region] || input.region
  }

  if (input.mbti) {
    payload.mbti = input.mbti
  }

  if (typeof input.intro === "string") {
    payload.intro = input.intro
  }

  if (input.interestTags) {
    payload.interestTags = input.interestTags
  }

  const response = await apiFetch("/api/v1/users/me", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const baseResponse: BaseResponse<UserProfileResponseDto> = await response.json()
  if (!baseResponse.isSuccess || !baseResponse.data) {
    throw new Error(baseResponse.message || baseResponse.errorCode || "프로필 수정에 실패했습니다.")
  }

  return mapProfileToUser(baseResponse.data)
}

interface UserSurveyResponseDto {
  detailedInfo: Array<Record<string, unknown>> | null
}

export async function getMySurvey(): Promise<SurveyData> {
  const response = await apiFetch("/api/v1/users/me/survey")
  const baseResponse: BaseResponse<UserSurveyResponseDto> = await response.json()

  if (!baseResponse.isSuccess || !baseResponse.data) {
    throw new Error(baseResponse.message || baseResponse.errorCode || "설문조사 조회에 실패했습니다.")
  }

  return mapDetailedInfoToSurveyData(baseResponse.data.detailedInfo)
}

export async function updateMySurvey(input: SurveyData): Promise<SurveyData> {
  const detailedInfo = convertSurveyDataToDetailedInfo(input)

  const response = await apiFetch("/api/v1/users/me/survey", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ detailedInfo }),
  })

  const baseResponse: BaseResponse<UserSurveyResponseDto> = await response.json()
  if (!baseResponse.isSuccess || !baseResponse.data) {
    throw new Error(baseResponse.message || baseResponse.errorCode || "설문조사 수정에 실패했습니다.")
  }

  return mapDetailedInfoToSurveyData(baseResponse.data.detailedInfo)
}

export async function withdrawAccount(): Promise<void> {
  const response = await apiFetch("/api/v1/users/me", {
    method: "DELETE",
  })

  const baseResponse: BaseResponse<null> = await response.json()
  if (!baseResponse.isSuccess) {
    throw new Error(baseResponse.message || baseResponse.errorCode || "회원탈퇴에 실패했습니다.")
  }
}
