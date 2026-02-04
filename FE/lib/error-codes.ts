/**
 * 백엔드 ErrorCode.java와 동기화된 에러 코드 타입 및 유틸
 * BE: com.ssafy.unblur.common.exception.ErrorCode
 */

/** 백엔드에서 반환하는 에러 코드 (ErrorCode.getCode()) */
export type ErrorCode =
  | "USER-001"
  | "USER-002"
  | "USER-003"
  | "USER-004"
  | "USER-005"
  | "USER-006"
  | "USER-007"
  | "USER-008"
  | "AUTH-001"
  | "AUTH-002"
  | "AUTH-003"
  | "AUTH-004"
  | "AUTH-005"
  | "AUTH-006"
  | "AUTH-007"
  | "AUTH-008"
  | "AUTH-009"
  | "RTC-001"
  | "RTC-002"
  | "MATCH-001"
  | "MATCH-002"
  | "MATCH-003"
  | "MATCH-004"
  | "MATCH-005"
  | "BALANCE-001"
  | "BALANCE-002"
  | "BALANCE-003"
  | "BALANCE-004"
  | "BALANCE-005"
  | "BALANCE-006"
  | "BALANCE-007"
  | "BALANCE-008"
  | "BALANCE-009"
  | "BALANCE-010"
  | "CONF-001"
  | "CONF-002"
  | "CONF-003"
  | "CONF-004"
  | "CONF-005"
  | "EVAL-001"
  | "COMMON-001"
  | "COMMON-002"
  | "COMMON-003"

/** API 에러 응답 본문 (BE BaseResponse 실패 시) */
export interface ApiErrorBody {
  isSuccess?: boolean
  statusCode?: number
  message?: string
  errorCode?: string
}

/**
 * API 에러 클래스 (errorCode, message, statusCode 보존)
 * - err instanceof ApiError 로 구분 가능
 * - err.errorCode 로 BE 에러 코드 처리 가능
 */
export class ApiError extends Error {
  constructor(
    public readonly errorCode: string,
    message: string,
    public readonly statusCode?: number
  ) {
    super(message)
    this.name = "ApiError"
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}

/**
 * Response가 ok가 아닐 때 본문을 파싱해 ApiError 생성
 * - response.json() 호출 후 body 소비되므로 한 번만 사용
 */
export async function parseApiError(response: Response): Promise<ApiError> {
  let body: ApiErrorBody = {}
  try {
    const text = await response.text()
    if (text) body = JSON.parse(text) as ApiErrorBody
  } catch {
    // ignore
  }
  const message =
    body?.message ?? (response.status === 401 ? "로그인이 필요합니다." : "요청에 실패했습니다.")
  const errorCode = body?.errorCode ?? `HTTP_${response.status}`
  return new ApiError(errorCode, message, response.status)
}

/** 401/403 인증·권한 에러 시 api.ts에서 던지는 메시지 (기존 호환용) */
export const AUTH_FORBIDDEN_MESSAGE = "AUTH_FORBIDDEN"

/** ApiError인지 확인 */
export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError
}

/** Conflict(409) 에러인지 확인 */
export function isConflictError(err: unknown): boolean {
  if (isApiError(err)) return err.statusCode === 409
  return err instanceof Error && err.message?.includes("API_ERROR_409")
}

// --- BE ErrorCode에 맞는 FE 분류/액션 ---

/** 에러 코드별 FE 처리 분류 (BE ErrorCode 기준) */
export type ErrorCodeCategory =
  | "auth_required"   // 로그인 필요·토큰 만료 → 로그인 유도
  | "form_validation" // 회원가입/로그인 폼 필드 오류 (중복, 형식 등)
  | "conflict"        // 이미 존재/진행 중 등 → UI 상태 리셋 또는 안내
  | "forbidden"       // 권한 없음·비활성 계정
  | "bad_request"     // 잘못된 요청·필수값 누락
  | "server_error"    // 5xx

/** 에러 코드 → FE 분류 (BE ErrorCode.java와 1:1 매핑) */
export const ERROR_CODE_CATEGORY: Record<string, ErrorCodeCategory> = {
  "USER-001": "bad_request",
  "USER-002": "form_validation",
  "USER-003": "form_validation",
  "USER-004": "form_validation",
  "USER-005": "forbidden",
  "USER-006": "bad_request",
  "USER-007": "conflict",
  "USER-008": "bad_request",
  "AUTH-001": "bad_request",
  "AUTH-002": "form_validation",
  "AUTH-003": "auth_required",
  "AUTH-004": "auth_required",
  "AUTH-005": "auth_required",
  "AUTH-006": "form_validation",
  "AUTH-007": "auth_required",
  "AUTH-008": "forbidden",
  "AUTH-009": "form_validation",
  "RTC-001": "server_error",
  "RTC-002": "forbidden",
  "MATCH-001": "bad_request",
  "MATCH-002": "conflict",
  "MATCH-003": "bad_request",
  "MATCH-004": "conflict",
  "MATCH-005": "conflict",
  "BALANCE-001": "conflict",
  "BALANCE-002": "forbidden",
  "BALANCE-003": "conflict",
  "BALANCE-004": "bad_request",
  "BALANCE-005": "bad_request",
  "BALANCE-006": "bad_request",
  "BALANCE-007": "forbidden",
  "BALANCE-008": "bad_request",
  "BALANCE-009": "conflict",
  "BALANCE-010": "bad_request",
  "CONF-001": "bad_request",
  "CONF-002": "forbidden",
  "CONF-003": "conflict",
  "CONF-004": "conflict",
  "CONF-005": "conflict",
  "EVAL-001": "conflict",
  "COMMON-001": "server_error",
  "COMMON-002": "bad_request",
  "COMMON-003": "bad_request",
}

/** 에러 코드 → 로그인/회원가입 폼 필드 (필드별 메시지 표시용) */
export type ErrorFormField = "email" | "nickname" | "password" | "general"

const ERROR_CODE_FORM_FIELD: Record<string, ErrorFormField> = {
  "USER-002": "general",
  "USER-003": "email",
  "USER-004": "nickname",
  "AUTH-002": "password",
  "AUTH-009": "email",
}

export function getErrorCodeCategory(code: string): ErrorCodeCategory {
  return ERROR_CODE_CATEGORY[code] ?? (code.startsWith("HTTP_5") ? "server_error" : "bad_request")
}

/** 로그인/회원가입 실패 시 어느 필드에 메시지 띄울지 */
export function getFormFieldForErrorCode(code: string): ErrorFormField | null {
  return ERROR_CODE_FORM_FIELD[code] ?? null
}

/** 로그인 필요·토큰 만료 등 → 로그인 모달/리다이렉트 시 사용 */
export function isAuthRequiredErrorCode(code: string): boolean {
  return getErrorCodeCategory(code) === "auth_required"
}

/** 충돌(이미 대기열, 이미 선택 등) → UI 리셋/안내 시 사용 */
export function isConflictErrorCode(code: string): boolean {
  return getErrorCodeCategory(code) === "conflict"
}
