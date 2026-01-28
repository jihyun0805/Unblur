import { reissueToken } from "./api/auth"

const AUTH_TOKEN_KEY = "auth_token"
const USER_KEY = "user"

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY)

export const setAuthToken = (token: string) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export const clearAuthToken = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

/**
 * 상대 경로를 절대 URL로 변환
 */
export const resolveApiUrl = (input: RequestInfo | URL): string => {
  if (typeof input === "string" && input.startsWith("/")) {
    return `${API_BASE_URL}${input}`
  }
  return typeof input === "string" ? input : input.toString()
}

/**
 * API 요청을 보내고, 401 에러 시 자동으로 토큰 재발급을 시도합니다.
 * @param input 요청 URL
 * @param init 요청 옵션
 * @param retried 재시도 여부 (내부 사용, 무한 루프 방지)
 * @returns 응답 객체
 */
export const apiFetch = async (
  input: RequestInfo | URL, 
  init: RequestInit = {},
  retried = false
): Promise<Response> => {
  const token = getAuthToken()
  const headers = new Headers(init.headers)

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  // 상대 경로인 경우 API_BASE_URL 추가
  const url = resolveApiUrl(input)

  const response = await fetch(url, { 
    ...init, 
    headers,
    credentials: "include", // 쿠키 포함
  })

  // 401 에러 발생 시 토큰 재발급 시도
  if (response.status === 401 && !retried) {
    try {
      // 토큰 재발급 시도
      await reissueToken()
      
      // 재발급 성공 시 원래 요청 재시도 (한 번만)
      const newToken = getAuthToken()
      const newHeaders = new Headers(init.headers)
      
      if (newToken) {
        newHeaders.set("Authorization", `Bearer ${newToken}`)
      }

      const retryResponse = await fetch(url, {
        ...init,
        headers: newHeaders,
        credentials: "include",
      })

      if (retryResponse.status === 401 || retryResponse.status === 403) {
        // 재시도 후에도 401이면 토큰 삭제하고 에러
        clearAuthToken()
        throw new Error("AUTH_FORBIDDEN")
      }

      if (!retryResponse.ok) {
        throw new Error(`API_ERROR_${retryResponse.status}`)
      }

      return retryResponse
    } catch (reissueError) {
      // 토큰 재발급 실패 시 토큰 삭제하고 에러
      clearAuthToken()
      throw new Error("AUTH_FORBIDDEN")
    }
  }

  if (response.status === 401 || response.status === 403) {
    clearAuthToken()
    throw new Error("AUTH_FORBIDDEN")
  }

  if (!response.ok) {
    throw new Error(`API_ERROR_${response.status}`)
  }

  return response
}
