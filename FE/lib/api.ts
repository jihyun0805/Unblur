import { toast } from "@/hooks/use-toast"
import { reissueToken } from "./api/auth"

const AUTH_TOKEN_KEY = "auth_token"
const AUTH_REMEMBER_KEY = "auth_remember"
const USER_KEY = "user"

let memoryToken: string | null = null

export const getAuthToken = () => {
  if (memoryToken) return memoryToken
  const remember = localStorage.getItem(AUTH_REMEMBER_KEY) === "1"
  return remember ? localStorage.getItem(AUTH_TOKEN_KEY) : null
}

export const setAuthToken = (token: string, options?: { remember?: boolean }) => {
  memoryToken = token
  const remember = options?.remember ?? localStorage.getItem(AUTH_REMEMBER_KEY) === "1"
  if (remember) {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
    localStorage.setItem(AUTH_REMEMBER_KEY, "1")
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_REMEMBER_KEY)
  }
}

export const clearAuthToken = () => {
  memoryToken = null
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_REMEMBER_KEY)
  localStorage.removeItem(USER_KEY)
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
const IDEMPOTENCY_HEADER = "Idempotency-Key"
const IDEMPOTENT_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

export type ApiFetchInit = RequestInit & {
  idempotencyKey?: string
}

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
  init: ApiFetchInit = {},
  retried = false
): Promise<Response> => {
  const token = getAuthToken()
  const { idempotencyKey, ...restInit } = init
  const headers = new Headers(restInit.headers)

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const method = (restInit.method ?? "GET").toUpperCase()
  // 멱등 키는 POST/PUT/PATCH/DELETE 요청에만 추가
  if (idempotencyKey && IDEMPOTENT_METHODS.has(method)) {
    headers.set(IDEMPOTENCY_HEADER, idempotencyKey)
  }

  // 상대 경로인 경우 API_BASE_URL 추가
  const url = resolveApiUrl(input)

  const response = await fetch(url, { 
    ...restInit, 
    headers,
    credentials: "include", // 쿠키 포함
  })

  if (response.status === 409) {
    toast({
      title: "요청이 처리되지 않았어요. 잠시 후 다시 시도해 주세요.",
      variant: "destructive",
    })
  }

  // 401 에러 발생 시 토큰 재발급 시도
  if (response.status === 401 && !retried) {
    try {
      // 토큰 재발급 시도
      await reissueToken()
      
      // 재발급 성공 시 원래 요청 재시도 (한 번만)
      const newToken = getAuthToken()
      const newHeaders = new Headers(restInit.headers)
      
      if (newToken) {
        newHeaders.set("Authorization", `Bearer ${newToken}`)
      }

      if (idempotencyKey && IDEMPOTENT_METHODS.has(method)) {
        newHeaders.set(IDEMPOTENCY_HEADER, idempotencyKey)
      }

      const retryResponse = await fetch(url, {
        ...restInit,
        headers: newHeaders,
        credentials: "include",
      })

      if (retryResponse.status === 401) {
        clearAuthToken()
        throw new Error("AUTH_FORBIDDEN")
      }
      if (retryResponse.status === 403) {
        throw new Error("AUTH_FORBIDDEN")
      }
      if (retryResponse.status === 409) {
        toast({
          title: "요청이 처리되지 않았어요. 잠시 후 다시 시도해 주세요.",
          variant: "destructive",
        })
      }

      if (!retryResponse.ok) {
        throw new Error(`API_ERROR_${retryResponse.status}`)
      }

      return retryResponse
    } catch (reissueError) {
      clearAuthToken()
      throw new Error("AUTH_FORBIDDEN")
    }
  }

  if (response.status === 401) {
    clearAuthToken()
    throw new Error("AUTH_FORBIDDEN")
  }
  if (response.status === 403) {
    throw new Error("AUTH_FORBIDDEN")
  }

  if (!response.ok) {
    throw new Error(`API_ERROR_${response.status}`)
  }

  return response
}
