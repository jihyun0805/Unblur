import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import * as authApi from "@/lib/api/auth"

export interface RegisterFormData {
  nickname: string
  email: string
  password: string
  passwordConfirm: string
  birthYear: string
  birthMonth: string
  birthDay: string
  gender: "male" | "female" | ""
  region: string
  // 설문조사 데이터
  dateStyle: string
  contactStyle: string
  conflictStyle: string
  spending: string
  priority: string
  agePreference: string[]
  distancePreference: string
  smokingSelf: string
  smokingPartner: string
  drinkingSelf: string
  drinkingPartner: string
  religionSelf: string
  religionPartner: string
  petSelf: string
  petPartner: string
  mbti: string
  bio: string
  interests: string[]
}

const initialFormData: RegisterFormData = {
  nickname: "",
  email: "",
  password: "",
  passwordConfirm: "",
  birthYear: "",
  birthMonth: "",
  birthDay: "",
  gender: "",
  region: "",
  dateStyle: "",
  contactStyle: "",
  conflictStyle: "",
  spending: "",
  priority: "",
  agePreference: [],
  distancePreference: "",
  smokingSelf: "",
  smokingPartner: "",
  drinkingSelf: "",
  drinkingPartner: "",
  religionSelf: "",
  religionPartner: "",
  petSelf: "",
  petPartner: "",
  mbti: "",
  bio: "",
  interests: [],
}

export function useRegisterForm() {
  const [formData, setFormData] = useState<RegisterFormData>(initialFormData)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null)
  const [checkingNickname, setCheckingNickname] = useState(false)
  const { register } = useAuth()
  const { toast } = useToast()

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const updateFormData = (updates: Partial<RegisterFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
    // 닉네임이나 이메일이 변경되면 중복 확인 상태 리셋
    if (updates.nickname !== undefined) {
      setNicknameAvailable(null)
    }
    if (updates.email !== undefined) {
      setEmailAvailable(null)
    }
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setEmailAvailable(null)
    setNicknameAvailable(null)
    setShowPassword(false)
    setShowPasswordConfirm(false)
  }

  const validatePassword = (password: string) => {
    const hasLetter = /[a-zA-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecial = /[!*^?_]/.test(password)
    const isAllowedChars = /^[A-Za-z0-9!*^?_]*$/.test(password)
    const isValidLength = password.length >= 9 && password.length <= 16
    return {
      hasLetter,
      hasNumber,
      hasSpecial,
      isAllowedChars,
      isValidLength,
      isValid: hasLetter && hasNumber && hasSpecial && isAllowedChars && isValidLength,
    }
  }

  const normalizePassword = (value: string) => value.replace(/[^A-Za-z0-9!*^?_]/g, "")

  const checkNickname = async () => {
    if (formData.nickname.length < 2) {
      toast({
        title: "닉네임 오류",
        description: "닉네임은 2자 이상이어야 합니다.",
        variant: "destructive",
      })
      return
    }
    setCheckingNickname(true)
    try {
      const isDuplicate = await authApi.checkNickname(formData.nickname)
      setNicknameAvailable(!isDuplicate)
    } catch (error: any) {
      toast({
        title: "닉네임 확인 실패",
        description: error.message || "닉네임 중복 확인에 실패했습니다.",
        variant: "destructive",
      })
      setNicknameAvailable(null)
    } finally {
      setCheckingNickname(false)
    }
  }

  const checkEmail = async () => {
    if (!formData.email) {
      toast({
        title: "이메일 오류",
        description: "이메일을 입력해주세요.",
        variant: "destructive",
      })
      return
    }
    if (!validateEmail(formData.email)) {
      toast({
        title: "이메일 형식 오류",
        description: "올바른 이메일 형식을 입력해주세요.",
        variant: "destructive",
      })
      return
    }
    setCheckingEmail(true)
    try {
      const isDuplicate = await authApi.checkEmail(formData.email)
      setEmailAvailable(!isDuplicate)
    } catch (error: any) {
      toast({
        title: "이메일 확인 실패",
        description: error.message || "이메일 중복 확인에 실패했습니다.",
        variant: "destructive",
      })
      setEmailAvailable(null)
    } finally {
      setCheckingEmail(false)
    }
  }

  const calculateAge = (year: string, month: string, day: string) => {
    const today = new Date()
    const birthDate = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const submitRegistration = async (): Promise<{ success: true } | { success: false; error: Error }> => {
    setIsLoading(true)
    const age = calculateAge(formData.birthYear, formData.birthMonth, formData.birthDay)
    const result = await register({
      nickname: formData.nickname,
      email: formData.email,
      password: formData.password,
      birthDate: `${formData.birthYear}-${formData.birthMonth.padStart(2, "0")}-${formData.birthDay.padStart(2, "0")}`,
      age,
      gender: formData.gender as "male" | "female",
      region: formData.region,
      mbti: formData.mbti || undefined,
      bio: formData.bio || undefined,
      surveyData: {
        dateStyle: formData.dateStyle,
        contactStyle: formData.contactStyle,
        conflictStyle: formData.conflictStyle,
        spending: formData.spending,
        priority: formData.priority,
        agePreference: formData.agePreference,
        distancePreference: formData.distancePreference,
        smokingSelf: formData.smokingSelf,
        smokingPartner: formData.smokingPartner,
        drinkingSelf: formData.drinkingSelf,
        drinkingPartner: formData.drinkingPartner,
        religionSelf: formData.religionSelf,
        religionPartner: formData.religionPartner,
        petSelf: formData.petSelf,
        petPartner: formData.petPartner,
        interests: formData.interests,
      },
    })
    setIsLoading(false)
    return result
  }

  return {
    formData,
    updateFormData,
    resetForm,
    showPassword,
    setShowPassword,
    showPasswordConfirm,
    setShowPasswordConfirm,
    isLoading,
    emailAvailable,
    checkingEmail,
    nicknameAvailable,
    checkingNickname,
    validatePassword,
    normalizePassword,
    validateEmail,
    checkNickname,
    checkEmail,
    calculateAge,
    submitRegistration,
  }
}
