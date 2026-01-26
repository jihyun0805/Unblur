import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export interface RegisterFormData {
  nickname: string
  username: string
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
  username: "",
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
  const [isLoading, setIsLoading] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null)
  const [checkingNickname, setCheckingNickname] = useState(false)
  const { register } = useAuth()
  const { toast } = useToast()

  const updateFormData = (updates: Partial<RegisterFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
    // 닉네임이나 아이디가 변경되면 중복 확인 상태 리셋
    if (updates.nickname !== undefined) {
      setNicknameAvailable(null)
    }
    if (updates.username !== undefined) {
      setUsernameAvailable(null)
    }
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setUsernameAvailable(null)
    setNicknameAvailable(null)
    setShowPassword(false)
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

  const normalizeUsername = (value: string) => value.replace(/[^A-Za-z0-9]/g, "")
  const normalizePassword = (value: string) => value.replace(/[^A-Za-z0-9!*^?_]/g, "")
  const isUsernameValid = (value: string) => /^[A-Za-z0-9]+$/.test(value)

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
    await new Promise((resolve) => setTimeout(resolve, 300))
    // 실제로는 서버에서 중복 확인
    setNicknameAvailable(formData.nickname !== "테스트")
    setCheckingNickname(false)
  }

  const checkUsername = async () => {
    if (formData.username.length < 4) {
      toast({
        title: "아이디 오류",
        description: "아이디는 4자 이상이어야 합니다.",
        variant: "destructive",
      })
      return
    }
    if (!isUsernameValid(formData.username)) {
      toast({
        title: "아이디 오류",
        description: "아이디는 영문과 숫자만 사용할 수 있습니다.",
        variant: "destructive",
      })
      return
    }
    setCheckingUsername(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    // 실제로는 서버에서 중복 확인
    setUsernameAvailable(formData.username !== "demo")
    setCheckingUsername(false)
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

  const submitRegistration = async () => {
    setIsLoading(true)
    const age = calculateAge(formData.birthYear, formData.birthMonth, formData.birthDay)
    const success = await register({
      nickname: formData.nickname,
      username: formData.username,
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
    return success
  }

  return {
    formData,
    updateFormData,
    resetForm,
    showPassword,
    setShowPassword,
    isLoading,
    usernameAvailable,
    checkingUsername,
    nicknameAvailable,
    checkingNickname,
    validatePassword,
    normalizeUsername,
    normalizePassword,
    isUsernameValid,
    checkNickname,
    checkUsername,
    calculateAge,
    submitRegistration,
  }
}
