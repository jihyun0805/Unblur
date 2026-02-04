import { toast } from "@/hooks/use-toast"
import { v4 as uuidv4 } from "uuid"
import { reissueToken } from "./api/auth"
import { ApiError, parseApiError, AUTH_FORBIDDEN_MESSAGE, ERROR_CODE_CATEGORY } from "./error-codes"

const AUTH_TOKEN_KEY = "auth_token"
const AUTH_REMEMBER_KEY = "auth_remember"
export const USER_KEY = "user"

let memoryToken: string | null = null

export const getAuthToken = () => {
  if (memoryToken) return memoryToken
  // 전체 새로고침 시에도 복원: localStorage에서 토큰 읽기
  const stored = typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null
  if (stored) memoryToken = stored
  return stored
}

export const setAuthToken = (token: string, options?: { remember?: boolean }) => {
  memoryToken = token
  // 로그인/재발급 시 항상 localStorage에 저장 → 전체 새로고침 시 복원
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
    const remember = options?.remember ?? localStorage.getItem(AUTH_REMEMBER_KEY) === "1"
    localStorage.setItem(AUTH_REMEMBER_KEY, remember ? "1" : "0")
  }
}

/** 토큰 만료/무효로 인한 로그아웃 시 AuthProvider가 구독하는 이벤트 이름 */
export const AUTH_EXPIRED_EVENT = "auth:expired"

export const clearAuthToken = () => {
  memoryToken = null
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_REMEMBER_KEY)
  localStorage.removeItem(USER_KEY)
}

/** 인증 만료로 토큰 정리 + 로그아웃 알림 (401/refresh 실패 시에만 사용) */
const clearAuthAndNotify = () => {
  clearAuthToken()
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT))
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
const IDEMPOTENCY_HEADER = "Idempotency-Key"
const IDEMPOTENT_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

// 요청 단위 멱등성 키 생성 (crypto 우선, 없으면 실패)
const createIdempotencyKey = (): string => {
  // Web Crypto API 참조
  const cryptoRef = typeof globalThis !== "undefined" ? globalThis.crypto : undefined

  if (cryptoRef) { // Web Crypto API 사용 가능한 경우
    // randomUUID 함수가 있으면 사용
    if (typeof cryptoRef.randomUUID === "function") {
      return cryptoRef.randomUUID()
    }

    // randomUUID 함수가 없으면 getRandomValues로 바이트 생성 후 uuidv4에 전달
    if (typeof cryptoRef.getRandomValues === "function") {
      return uuidv4({
        rng: () => {
          const bytes = new Uint8Array(16)
          cryptoRef.getRandomValues(bytes)
          return bytes
        },
      })
    }
  }

  // Web Crypto API를 사용할 수 없는 경우
  throw new Error("Idempotency key generation failed: Web Crypto API unavailable.")
}

export type ApiFetchInit = RequestInit & {
  /** 401 시 토큰 정리/로그아웃 알림 생략 (세션 종료 후 평가 등 비즈니스 401용) */
  skipAuthClearOn401?: boolean
  /** true이면 !response.ok 시 토스트 생략 (호출부에서 메시지 표시할 때 사용) */
  skipToastOnError?: boolean
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
  const { skipAuthClearOn401, skipToastOnError, ...restInit } = init
  const headers = new Headers(restInit.headers)

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const method = (restInit.method ?? "GET").toUpperCase()
  // 호출부에서 헤더를 직접 넣은 경우를 우선 사용
  const existingHeaderKey = headers.get(IDEMPOTENCY_HEADER)
  const resolvedIdempotencyKey = IDEMPOTENT_METHODS.has(method)
    ? (existingHeaderKey?.trim() || createIdempotencyKey())
    : ""

  // 멱등 키는 POST/PUT/PATCH/DELETE 요청에만 추가
  if (resolvedIdempotencyKey) {
    headers.set(IDEMPOTENCY_HEADER, resolvedIdempotencyKey)
  }

  // 상대 경로인 경우 API_BASE_URL 추가
  const url = resolveApiUrl(input)

  const response = await fetch(url, { 
    ...restInit, 
    headers,
    credentials: "include", // 쿠키 포함
  })

  // 401 에러 발생 시 토큰 재발급 시도
  if (response.status === 401 && !retried) {
    try {
      await reissueToken()
      const newToken = getAuthToken()
      const newHeaders = new Headers(restInit.headers)
      if (newToken) newHeaders.set("Authorization", `Bearer ${newToken}`)
      if (resolvedIdempotencyKey) {
        newHeaders.set(IDEMPOTENCY_HEADER, resolvedIdempotencyKey)
      }
      const retryResponse = await fetch(url, {
        ...restInit,
        headers: newHeaders,
        credentials: "include",
      })
      if (retryResponse.status === 401) {
        if (!skipAuthClearOn401) clearAuthAndNotify()
        throw new Error(AUTH_FORBIDDEN_MESSAGE)
      }
      if (retryResponse.status === 403) {
        throw new Error(AUTH_FORBIDDEN_MESSAGE)
      }
      if (!retryResponse.ok) {
        const err = await parseApiError(retryResponse)
        if (!skipToastOnError) toast({ title: err.message, variant: "destructive" })
        throw err
      }
      return retryResponse
    } catch (e) {
      if (e instanceof ApiError) {
        // AUTH-003/004 등 토큰 무효·만료는 reissue 실패로 예상 가능 → 토스트 없이 로그인 필요 처리
        if (ERROR_CODE_CATEGORY[e.errorCode] === "auth_required") {
          if (!skipAuthClearOn401) clearAuthAndNotify()
          throw new Error(AUTH_FORBIDDEN_MESSAGE)
        }
        throw e
      }
      if (e instanceof Error && e.message === AUTH_FORBIDDEN_MESSAGE) throw e
      if (!skipAuthClearOn401) clearAuthAndNotify()
      throw new Error(AUTH_FORBIDDEN_MESSAGE)
    }
  }

  if (response.status === 401) {
    if (!skipAuthClearOn401) clearAuthAndNotify()
    throw new Error(AUTH_FORBIDDEN_MESSAGE)
  }
  if (response.status === 403) {
    throw new Error(AUTH_FORBIDDEN_MESSAGE)
  }

  if (!response.ok) {
    const err = await parseApiError(response)
    if (!skipToastOnError) toast({ title: err.message, variant: "destructive" })
    throw err
  }

  return response
}
