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

export const apiFetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const token = getAuthToken()
  const headers = new Headers(init.headers)

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(input, { ...init, headers })

  if (response.status === 401 || response.status === 403) {
    clearAuthToken()
    throw new Error("AUTH_FORBIDDEN")
  }

  if (!response.ok) {
    throw new Error(`API_ERROR_${response.status}`)
  }

  return response
}
