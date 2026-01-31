import { apiFetch, setAuthToken, resolveApiUrl } from "@/lib/api"

/**
 * 한글 지역명을 영문 코드로 변환
 */
const regionMap: Record<string, string> = {
  "서울": "SEOUL",
  "경기": "GYEONGGI",
  "인천": "INCHEON",
  "부산": "BUSAN",
  "대구": "DAEGU",
  "대전": "DAEJEON",
  "광주": "GWANGJU",
  "울산": "ULSAN",
  "세종": "SEJONG",
  "강원": "GANGWON",
  "충북": "CHUNGBUK",
  "충남": "CHUNGNAM",
  "전북": "JEONBUK",
  "전남": "JEONNAM",
  "경북": "GYEONGBUK",
  "경남": "GYEONGNAM",
  "제주": "JEJU",
}

export function convertRegionToCode(region: string): string | undefined {
  return regionMap[region]
}

export interface BaseResponse<T> {
  isSuccess: boolean
  statusCode: number
  message: string
  data: T
  errorCode?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
}

export interface SignupRequest {
  email: string
  password: string
  nickname: string
  birthDate: string
  gender: "MALE" | "FEMALE"
  region?: string
  detailedInfo?: Array<Record<string, unknown>>
  interestTags: string[]
  mbti?: string
  intro?: string
}

/**
 * 설문 데이터를 detailedInfo 형식으로 변환
 */
export function convertSurveyDataToDetailedInfo(surveyData: {
  dateStyle?: string
  contactStyle?: string
  conflictStyle?: string
  spending?: string
  priority?: string
  agePreference?: string[]
  distancePreference?: string
  smokingSelf?: string
  smokingPartner?: string
  drinkingSelf?: string
  drinkingPartner?: string
  religionSelf?: string
  religionPartner?: string
  petSelf?: string
  petPartner?: string
}): Array<Record<string, unknown>> {
  const detailedInfo: Array<Record<string, unknown>> = []
  
  if (surveyData.dateStyle) {
    detailedInfo.push({ QuestionId: "dateStyle", Answer: surveyData.dateStyle })
  }
  if (surveyData.contactStyle) {
    detailedInfo.push({ QuestionId: "contactStyle", Answer: surveyData.contactStyle })
  }
  if (surveyData.conflictStyle) {
    detailedInfo.push({ QuestionId: "conflictStyle", Answer: surveyData.conflictStyle })
  }
  if (surveyData.spending) {
    detailedInfo.push({ QuestionId: "spending", Answer: surveyData.spending })
  }
  if (surveyData.priority) {
    detailedInfo.push({ QuestionId: "priority", Answer: surveyData.priority })
  }
  if (surveyData.agePreference && surveyData.agePreference.length > 0) {
    detailedInfo.push({ QuestionId: "agePreference", Answer: surveyData.agePreference })
  }
  if (surveyData.distancePreference) {
    detailedInfo.push({ QuestionId: "distancePreference", Answer: surveyData.distancePreference })
  }
  if (surveyData.smokingSelf) {
    detailedInfo.push({ QuestionId: "smokingSelf", Answer: surveyData.smokingSelf })
  }
  if (surveyData.smokingPartner) {
    detailedInfo.push({ QuestionId: "smokingPartner", Answer: surveyData.smokingPartner })
  }
  if (surveyData.drinkingSelf) {
    detailedInfo.push({ QuestionId: "drinkingSelf", Answer: surveyData.drinkingSelf })
  }
  if (surveyData.drinkingPartner) {
    detailedInfo.push({ QuestionId: "drinkingPartner", Answer: surveyData.drinkingPartner })
  }
  if (surveyData.religionSelf) {
    detailedInfo.push({ QuestionId: "religionSelf", Answer: surveyData.religionSelf })
  }
  if (surveyData.religionPartner) {
    detailedInfo.push({ QuestionId: "religionPartner", Answer: surveyData.religionPartner })
  }
  if (surveyData.petSelf) {
    detailedInfo.push({ QuestionId: "petSelf", Answer: surveyData.petSelf })
  }
  if (surveyData.petPartner) {
    detailedInfo.push({ QuestionId: "petPartner", Answer: surveyData.petPartner })
  }
  
  return detailedInfo
}

export interface SignupResponse {
  email: string
}

/**
 * 로그인 API
 * @param email 이메일
 * @param password 비밀번호
 * @returns 로그인 성공 여부 및 토큰
 */
export async function login(email: string, password: string, remember = false): Promise<LoginResponse> {
  const response = await fetch(resolveApiUrl("/api/v1/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // 쿠키 포함
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    try {
      const errorData: BaseResponse<unknown> = await response.json()
      throw new Error(errorData.message || `로그인 실패: ${response.status}`)
    } catch (parseError) {
      throw new Error(`로그인 실패: ${response.status}`)
    }
  }

  // 응답 헤더에서 Authorization 토큰 추출
  const authHeader = response.headers.get("Authorization")
  const token = authHeader?.replace("Bearer ", "") || ""

  const baseResponse: BaseResponse<LoginResponse> = await response.json()
  
  if (!baseResponse.isSuccess || !baseResponse.data) {
    throw new Error(baseResponse.message || "로그인에 실패했습니다")
  }

  // 헤더의 토큰이 있으면 우선 사용, 없으면 응답 body의 토큰 사용
  const accessToken = token || baseResponse.data.accessToken
  
  if (accessToken) {
    setAuthToken(accessToken, { remember })
  }

  return baseResponse.data
}

/**
 * 회원가입 API
 * @param data 회원가입 데이터
 * @returns 회원가입 성공 여부
 */
export async function signup(data: SignupRequest): Promise<SignupResponse> {
  const response = await fetch(resolveApiUrl("/api/v1/auth/register"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    try {
      const errorData: BaseResponse<unknown> = await response.json()
      throw new Error(errorData.message || `회원가입 실패: ${response.status}`)
    } catch (parseError) {
      throw new Error(`회원가입 실패: ${response.status}`)
    }
  }

  const baseResponse: BaseResponse<SignupResponse> = await response.json()
  
  if (!baseResponse.isSuccess || !baseResponse.data) {
    throw new Error(baseResponse.message || "회원가입에 실패했습니다")
  }

  return baseResponse.data
}

/**
 * 이메일 중복 확인 API
 * @param email 확인할 이메일
 * @returns 중복 여부 (true: 중복됨, false: 사용 가능)
 */
export async function checkEmail(email: string): Promise<boolean> {
  const response = await fetch(resolveApiUrl(`/api/v1/auth/check-email?email=${encodeURIComponent(email)}`), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(`이메일 확인 실패: ${response.status}`)
  }

  const baseResponse: BaseResponse<boolean> = await response.json()
  
  if (!baseResponse.isSuccess) {
    throw new Error(baseResponse.message || "이메일 확인에 실패했습니다")
  }

  return baseResponse.data
}

/**
 * 닉네임 중복 확인 API
 * @param nickname 확인할 닉네임
 * @returns 중복 여부 (true: 중복됨, false: 사용 가능)
 */
export async function checkNickname(nickname: string): Promise<boolean> {
  const response = await fetch(resolveApiUrl(`/api/v1/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(`닉네임 확인 실패: ${response.status}`)
  }

  const baseResponse: BaseResponse<boolean> = await response.json()
  
  if (!baseResponse.isSuccess) {
    throw new Error(baseResponse.message || "닉네임 확인에 실패했습니다")
  }

  return baseResponse.data
}

/**
 * 토큰 재발급 API
 * @returns 새로운 액세스 토큰
 */
export async function reissueToken(): Promise<LoginResponse> {
  const response = await fetch(resolveApiUrl("/api/v1/auth/reissue"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // 쿠키에서 refresh_token 읽음
  })

  if (!response.ok) {
    throw new Error(`토큰 재발급 실패: ${response.status}`)
  }

  // 응답 헤더에서 Authorization 토큰 추출
  const authHeader = response.headers.get("Authorization")
  const token = authHeader?.replace("Bearer ", "") || ""

  const baseResponse: BaseResponse<LoginResponse> = await response.json()
  
  if (!baseResponse.isSuccess || !baseResponse.data) {
    throw new Error(baseResponse.message || "토큰 재발급에 실패했습니다")
  }

  // 헤더의 토큰이 있으면 우선 사용, 없으면 응답 body의 토큰 사용
  const accessToken = token || baseResponse.data.accessToken
  
  if (accessToken) {
    setAuthToken(accessToken)
  }

  return baseResponse.data
}

/**
 * 로그아웃 API
 */
export async function logout(): Promise<void> {
  const response = await fetch(resolveApiUrl("/api/v1/auth/logout"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(`로그아웃 실패: ${response.status}`)
  }
}
