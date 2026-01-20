"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  nickname: string
  age: number
  gender: "male" | "female"
  region: string
  birthDate?: string
  bio?: string
  mbti?: string
  temperature: number
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  register: (data: RegisterData) => Promise<boolean>
  logout: () => void
  updateUser: (data: Partial<User>) => void
  updateTemperature: (rating: number) => void
}

interface RegisterData {
  nickname: string
  username: string
  password: string
  birthDate: string
  age: number
  gender: "male" | "female"
  region: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const MOCK_USERS: { [key: string]: User & { password: string } } = {
  demo: {
    id: "1",
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
    const token = localStorage.getItem("auth_token")
    const savedUser = localStorage.getItem("user")
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const mockUser = MOCK_USERS[username]
    if (mockUser && mockUser.password === password) {
      const { password: _, ...userData } = mockUser
      setUser(userData)
      localStorage.setItem("auth_token", "mock_jwt_token")
      localStorage.setItem("user", JSON.stringify(userData))
      return true
    }
    return false
  }

  const register = async (data: RegisterData): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const newUser: User = {
      id: Date.now().toString(),
      nickname: data.nickname,
      age: data.age,
      gender: data.gender,
      region: data.region,
      birthDate: data.birthDate,
      temperature: 36.5,
    }

    setUser(newUser)
    localStorage.setItem("auth_token", "mock_jwt_token")
    localStorage.setItem("user", JSON.stringify(newUser))
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user")
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

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser, updateTemperature }}>
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
