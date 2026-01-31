"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { clearAuthToken, getAuthToken } from "@/lib/api"
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
  temperature: number
  surveyData?: SurveyData
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>
  register: (data: RegisterData) => Promise<boolean>
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


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      const token = getAuthToken()
      if (!token) {
        setIsLoading(false)
        return
      }
      try {
        const userData = await getMyProfile()
        setUser(userData)
        localStorage.setItem("user", JSON.stringify(userData))
      } catch {
        clearAuthToken()
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = async (email: string, password: string, rememberMe = false): Promise<boolean> => {
    try {
      await authApi.login(email, password)
      
      // 로그인 성공 후 사용자 정보 조회
      try {
        const userData = await getMyProfile()
        setUser(userData)
        localStorage.setItem("user", JSON.stringify(userData))
        return true
      } catch (error) {
        // 사용자 정보 조회 실패 시에도 로그인은 성공한 것으로 처리
        console.error("사용자 정보 조회 실패:", error)
        return true
      }
    } catch (error: any) {
      console.error("로그인 실패:", error)
      return false
    }
  }

  const register = async (data: RegisterData): Promise<boolean> => {
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
      return true
    } catch (error: any) {
      console.error("회원가입 실패:", error)
      return false
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
      localStorage.setItem("user", JSON.stringify(updatedUser))
    }
  }

  const updateTemperature = (rating: number) => {
    if (user) {
      const delta = (rating - 3) * 5 // 1점: -10, 3점: 0, 5점: +10
      const newTemp = Math.max(0, Math.min(100, user.temperature + delta))
      const updatedUser = { ...user, temperature: Math.round(newTemp) }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
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
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, deleteAccount, updateUser, updateTemperature }}>
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
