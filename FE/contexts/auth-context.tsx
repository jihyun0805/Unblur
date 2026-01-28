"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { apiFetch, clearAuthToken, getAuthToken, setAuthToken } from "@/lib/api"

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
  logout: () => void
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

const MOCK_USERS: { [key: string]: User & { password: string } } = {
  "demo@unblur.com": {
    email: "demo@unblur.com",
    nickname: "민수",
    age: 28,
    gender: "male",
    region: "서울",
    birthDate: "1997-03-15",
    bio: "커피를 좋아하는 개발자입니다.",
    mbti: "INTJ",
    temperature: 36.5,
    password: "demo1234!",
  },
}

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
        const response = await apiFetch("/api/v1/users/me")
        const userData = (await response.json()) as User
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
    await new Promise((resolve) => setTimeout(resolve, 500))

    const mockUser = MOCK_USERS[email]
    const storedUser = localStorage.getItem("mock_registered_user")
    const registeredUser = storedUser ? (JSON.parse(storedUser) as User & { password: string }) : null
    const candidate = mockUser ?? (registeredUser?.email === email ? registeredUser : null)

    if (candidate && candidate.password === password) {
      const { password: _, ...userData } = candidate
      setUser(userData)
      setAuthToken("mock_jwt_token")
      localStorage.setItem("user", JSON.stringify(userData))
      localStorage.setItem("mock_user_password", password)
      return true
    }
    return false
  }

  const register = async (data: RegisterData): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const newUser: User & { password: string } = {
      email: data.email,
      nickname: data.nickname,
      age: data.age,
      gender: data.gender,
      region: data.region,
      birthDate: data.birthDate,
      mbti: data.mbti,
      bio: data.bio,
      surveyData: data.surveyData,
      temperature: 36.5,
      password: data.password,
    }

    localStorage.setItem("mock_registered_user", JSON.stringify(newUser))
    localStorage.setItem("mock_user_password", data.password)
    return true
  }

  const logout = () => {
    setUser(null)
    clearAuthToken()
    localStorage.removeItem("mock_user_password")
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
      const delta = (rating - 3) * 0.25 // 1점: -0.5, 3점: 0, 5점: +0.5
      const newTemp = Math.max(30, Math.min(50, user.temperature + delta))
      const updatedUser = { ...user, temperature: Math.round(newTemp * 10) / 10 }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
    }
  }


  const deleteAccount = async (password: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!user?.email) {
      return false
    }

    const mockUser = MOCK_USERS[user.email]
    if (mockUser) {
      if (mockUser.password !== password) {
        return false
      }
    } else {
      const savedPassword = localStorage.getItem("mock_user_password")
      if (!savedPassword || savedPassword !== password) {
        return false
      }
    }

    logout()
    return true
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
