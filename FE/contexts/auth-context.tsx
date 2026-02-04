"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { clearAuthToken, getAuthToken, AUTH_EXPIRED_EVENT, USER_KEY } from "@/lib/api"
import * as authApi from "@/lib/api/auth"
import { getMyProfile, withdrawAccount } from "@/lib/api/user"

export interface SurveyData {
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
  interests?: string[]
}

export interface User {
  id: string
  email: string
  nickname: string
  age: number
  gender: "male" | "female"
  region: string
  birthDate?: string
  bio?: string
  mbti?: string
  loveDna?: string
  temperature: number
  surveyData?: SurveyData
}

/** 로그인/회원가입 결과 (실패 시 BE 메시지 전달) */
export type AuthResult = { success: true } | { success: false; error: Error }

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<AuthResult>
  register: (data: RegisterData) => Promise<AuthResult>
  logout: () => Promise<void>
  deleteAccount: (password: string) => Promise<boolean>
  updateUser: (data: Partial<User>) => void
  updateTemperature: (rating: number) => void
}

interface RegisterData {
  nickname: string
  email: string
  password: string
  birthDate: string
  age: number
  gender: "male" | "female"
  region: string
  mbti?: string
  bio?: string
  surveyData?: SurveyData
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)


function getInitialUser(): User | null {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem(USER_KEY)
    return stored ? (JSON.parse(stored) as User) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getInitialUser)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      if (!getAuthToken()) {
        setUser(null)
        setIsLoading(false)
        return
      }
      try {
        await authApi.reissueToken()
        // /session 직접 접근 시 getMyProfile() 401로 로그아웃되는 것 방지: reissue만 하고 localStorage user로 복원
        const pathname = typeof window !== "undefined" ? window.location.pathname : ""
        if (pathname === "/session" || pathname.startsWith("/session/")) {
          try {
            const stored = localStorage.getItem(USER_KEY)
            if (stored) setUser(JSON.parse(stored) as User)
          } catch {
            setUser(null)
          }
          setIsLoading(false)
          return
        }
        const userData = await getMyProfile()
        setUser(userData)
        localStorage.setItem(USER_KEY, JSON.stringify(userData))
      } catch {
        setUser(null)
        clearAuthToken()
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  // access token 만료 후 refresh 실패 시 api.ts에서 dispatch → 여기서 user null로 로그아웃 반영
  useEffect(() => {
    const onAuthExpired = () => setUser(null)
    window.addEventListener(AUTH_EXPIRED_EVENT, onAuthExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onAuthExpired)
  }, [])

  const login = async (email: string, password: string, rememberMe = false): Promise<AuthResult> => {
    try {
      await authApi.login(email, password, rememberMe)
      try {
        const userData = await getMyProfile()
        setUser(userData)
        localStorage.setItem(USER_KEY, JSON.stringify(userData))
        return { success: true }
      } catch (error) {
        console.error("사용자 정보 조회 실패:", error)
        return { success: true }
      }
    } catch (error: unknown) {
      console.error("로그인 실패:", error)
      return { success: false, error: error instanceof Error ? error : new Error("로그인에 실패했습니다.") }
    }
  }

  const register = async (data: RegisterData): Promise<AuthResult> => {
    try {
      // RegisterData를 SignupRequest로 변환
      const signupRequest: authApi.SignupRequest = {
        email: data.email,
        password: data.password,
        nickname: data.nickname,
        birthDate: data.birthDate,
        gender: data.gender === "male" ? "MALE" : "FEMALE",
        region: data.region ? authApi.convertRegionToCode(data.region) : undefined,
        detailedInfo: data.surveyData ? authApi.convertSurveyDataToDetailedInfo(data.surveyData) : undefined,
        interestTags: data.surveyData?.interests || [],
        mbti: data.mbti as authApi.SignupRequest["mbti"] | undefined,
        intro: data.bio,
      }

      await authApi.signup(signupRequest)
      return { success: true }
    } catch (error: unknown) {
      console.error("회원가입 실패:", error)
      return { success: false, error: error instanceof Error ? error : new Error("회원가입에 실패했습니다.") }
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error("로그아웃 API 호출 실패:", error)
    } finally {
      setUser(null)
      clearAuthToken()
    }
  }

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data }
      setUser(updatedUser)
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser))
    }
  }

  const updateTemperature = (rating: number) => {
    if (user) {
      const delta = (rating - 3) * 5 // 1점: -10, 3점: 0, 5점: +10
      const newTemp = Math.max(0, Math.min(100, user.temperature + delta))
      const updatedUser = { ...user, temperature: Math.round(newTemp) }
      setUser(updatedUser)
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser))
    }
  }


  const deleteAccount = async (password: string): Promise<boolean> => {
    try {
      // 비밀번호는 현재 API 스펙에 포함되지 않음
      await withdrawAccount()
      setUser(null)
      clearAuthToken()
      return true
    } catch (error) {
      console.error("계정 삭제 실패:", error)
      return false
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        deleteAccount,
        updateUser,
        updateTemperature,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
