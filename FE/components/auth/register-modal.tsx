"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react"
import { SURVEY_QUESTIONS } from "@/lib/survey-questions"

interface RegisterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToLogin: () => void
}

const REGIONS = [
  "서울",
  "경기",
  "인천",
  "부산",
  "대구",
  "대전",
  "광주",
  "울산",
  "세종",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
]

export function RegisterModal({ open, onOpenChange, onSwitchToLogin }: RegisterModalProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    nickname: "",
    username: "",
    password: "",
    passwordConfirm: "",
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    gender: "" as "male" | "female" | "",
    region: "",
    // 설문조사 데이터
    dateStyle: "",
    contactStyle: "",
    conflictStyle: "",
    spending: "",
    priority: "",
    agePreference: [] as string[],
    distancePreference: "",
    smokingSelf: "",
    smokingPartner: "",
    drinkingSelf: "",
    drinkingPartner: "",
    religionSelf: "",
    religionPartner: "",
    petSelf: "",
    petPartner: "",
    interests: [] as string[],
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null)
  const [checkingNickname, setCheckingNickname] = useState(false)
  const { register } = useAuth()
  const { toast } = useToast()

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

  const passwordValidation = validatePassword(formData.password)

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

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nickname || !formData.username || !formData.password) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    if (nicknameAvailable !== true) {
      toast({
        title: "닉네임 확인 필요",
        description: "닉네임 중복 확인을 해주세요.",
        variant: "destructive",
      })
      return
    }

    if (formData.username.length > 16) {
      toast({
        title: "입력 오류",
        description: "아이디는 16자 이내로 입력해주세요.",
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

    if (usernameAvailable !== true) {
      toast({
        title: "아이디 확인 필요",
        description: "아이디 중복 확인을 해주세요.",
        variant: "destructive",
      })
      return
    }

    if (!passwordValidation.isValid) {
      toast({
        title: "비밀번호 오류",
        description: "9~16자, 영문+숫자+특수문자(!*^?_) 조건을 확인해주세요.",
        variant: "destructive",
      })
      return
    }

    if (formData.password !== formData.passwordConfirm) {
      toast({
        title: "비밀번호 오류",
        description: "비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      })
      return
    }

    setStep(2)
  }

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.birthYear || !formData.birthMonth || !formData.birthDay || !formData.gender || !formData.region) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    const age = calculateAge(formData.birthYear, formData.birthMonth, formData.birthDay)
    if (age < 20 || age > 39) {
      toast({
        title: "나이 제한",
        description: "블라인드 소개팅은 2030 세대(20~39세)를 위한 서비스입니다.",
        variant: "destructive",
      })
      return
    }

    setStep(3)
  }

  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.dateStyle || !formData.contactStyle || !formData.conflictStyle || !formData.spending) {
      toast({
        title: "입력 오류",
        description: "모든 질문에 답변해주세요.",
        variant: "destructive",
      })
      return
    }

    setStep(4)
  }

  const handleStep4Submit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.priority || formData.agePreference.length === 0 || !formData.distancePreference) {
      toast({
        title: "입력 오류",
        description: "모든 질문에 답변해주세요.",
        variant: "destructive",
      })
      return
    }

    setStep(5)
  }

  const handleStep5Submit = (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.smokingSelf ||
      !formData.smokingPartner ||
      !formData.drinkingSelf ||
      !formData.drinkingPartner ||
      !formData.religionSelf ||
      !formData.religionPartner ||
      !formData.petSelf ||
      !formData.petPartner
    ) {
      toast({
        title: "입력 오류",
        description: "모든 질문에 답변해주세요.",
        variant: "destructive",
      })
      return
    }

    setStep(6)
  }

  const handleStep6Submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.interests.length === 0) {
      toast({
        title: "입력 오류",
        description: "관심사를 최소 1개 이상 선택해주세요.",
        variant: "destructive",
      })
      return
    }

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

    if (success) {
      toast({
        title: "회원가입 완료",
        description: "로그인 화면으로 이동합니다.",
      })
      onOpenChange(false)
      setStep(1)
      // Reset form
      setFormData({
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
        interests: [],
      })
      setUsernameAvailable(null)
      onSwitchToLogin()
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 30 }, (_, i) => currentYear - 20 - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const days = Array.from({ length: 31 }, (_, i) => i + 1)

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter((i) => i !== item)
    }
    return [...array, item]
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          setStep(1)
        }
        onOpenChange(open)
      }}
    >
      <DialogContent className="sm:max-w-lg bg-background max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">회원가입</DialogTitle>
          <div className="flex items-center justify-center gap-2 pt-2">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div key={s} className={`w-8 h-1 rounded-full ${step >= s ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </DialogHeader>

        {/* Step 1: 기본 정보 */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임</Label>
              <div className="flex gap-2">
                <Input
                  id="nickname"
                  placeholder="소개팅에서 사용할 닉네임"
                  value={formData.nickname}
                  onChange={(e) => {
                    setFormData({ ...formData, nickname: e.target.value })
                    setNicknameAvailable(null)
                  }}
                  className="bg-input flex-1"
                />
                <Button type="button" variant="outline" onClick={checkNickname} disabled={checkingNickname}>
                  {checkingNickname ? <Loader2 className="w-4 h-4 animate-spin" /> : "중복확인"}
                </Button>
              </div>
              {nicknameAvailable !== null && (
                <p className={`text-sm ${nicknameAvailable ? "text-green-600" : "text-destructive"}`}>
                  {nicknameAvailable ? "사용 가능한 닉네임입니다." : "이미 사용 중인 닉네임입니다."}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-username">아이디</Label>
              <div className="flex gap-2">
                <Input
                  id="reg-username"
                  placeholder="4~16자"
                  value={formData.username}
                  onChange={(e) => {
                    const nextValue = normalizeUsername(e.target.value)
                    setFormData({ ...formData, username: nextValue })
                    setUsernameAvailable(null)
                  }}
                  className="bg-input flex-1"
                  maxLength={16}
                />
                <Button type="button" variant="outline" onClick={checkUsername} disabled={checkingUsername}>
                  {checkingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : "중복확인"}
                </Button>
              </div>
              {usernameAvailable !== null && (
                <p className={`text-sm ${usernameAvailable ? "text-green-600" : "text-destructive"}`}>
                  {usernameAvailable ? "사용 가능한 아이디입니다." : "이미 사용 중인 아이디입니다."}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">비밀번호</Label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="9~16자, 영문+숫자+특수문자(!*^?_)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: normalizePassword(e.target.value) })}
                  className="bg-input pr-10"
                  maxLength={16}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formData.password && (
                <div className="flex flex-wrap gap-2 text-xs">
                  <span
                    className={`flex items-center gap-1 ${passwordValidation.isValidLength ? "text-green-600" : "text-muted-foreground"}`}
                  >
                    {passwordValidation.isValidLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}{" "}
                    9~16자
                  </span>
                  <span
                    className={`flex items-center gap-1 ${passwordValidation.hasLetter ? "text-green-600" : "text-muted-foreground"}`}
                  >
                    {passwordValidation.hasLetter ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} 영문
                  </span>
                  <span
                    className={`flex items-center gap-1 ${passwordValidation.hasNumber ? "text-green-600" : "text-muted-foreground"}`}
                  >
                    {passwordValidation.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} 숫자
                  </span>
                  <span
                    className={`flex items-center gap-1 ${passwordValidation.hasSpecial ? "text-green-600" : "text-muted-foreground"}`}
                  >
                    {passwordValidation.hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} 특수문자(!*^?_)
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-confirm">비밀번호 확인</Label>
              <Input
                id="password-confirm"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                value={formData.passwordConfirm}
                onChange={(e) => setFormData({ ...formData, passwordConfirm: normalizePassword(e.target.value) })}
                className="bg-input"
              />
              {formData.passwordConfirm && formData.password !== formData.passwordConfirm && (
                <p className="text-sm text-destructive">비밀번호가 일치하지 않습니다.</p>
              )}
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              다음
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              이미 계정이 있으신가요?{" "}
              <button type="button" onClick={onSwitchToLogin} className="text-foreground font-medium hover:underline">
                로그인
              </button>
            </div>
          </form>
        )}

        {/* Step 2: 개인 정보 */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>생년월일</Label>
              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={formData.birthYear}
                  onValueChange={(value) => setFormData({ ...formData, birthYear: value })}
                >
                  <SelectTrigger className="bg-input">
                    <SelectValue placeholder="년" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}년
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={formData.birthMonth}
                  onValueChange={(value) => setFormData({ ...formData, birthMonth: value })}
                >
                  <SelectTrigger className="bg-input">
                    <SelectValue placeholder="월" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month} value={month.toString()}>
                        {month}월
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={formData.birthDay}
                  onValueChange={(value) => setFormData({ ...formData, birthDay: value })}
                >
                  <SelectTrigger className="bg-input">
                    <SelectValue placeholder="일" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}일
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>성별</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={formData.gender === "male" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, gender: "male" })}
                  className={formData.gender === "male" ? "bg-primary text-primary-foreground" : ""}
                >
                  남성
                </Button>
                <Button
                  type="button"
                  variant={formData.gender === "female" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, gender: "female" })}
                  className={formData.gender === "female" ? "bg-primary text-primary-foreground" : ""}
                >
                  여성
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>지역</Label>
              <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                <SelectTrigger className="bg-input">
                  <SelectValue placeholder="지역을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                이전
              </Button>
              <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                다음
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Phase 1. 나의 분위기 (Vibe Check) */}
        {step === 3 && (
          <form onSubmit={handleStep3Submit} className="space-y-4 mt-4">
            <h3 className="font-semibold text-center">Phase 1. 나의 분위기 (Vibe Check)</h3>

            <div className="space-y-2">
              <Label>{SURVEY_QUESTIONS.dateStyle.question}</Label>
              <Select value={formData.dateStyle} onValueChange={(value) => setFormData({ ...formData, dateStyle: value })}>
                <SelectTrigger className="bg-input">
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {SURVEY_QUESTIONS.dateStyle.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{SURVEY_QUESTIONS.contactStyle.question}</Label>
              <Select value={formData.contactStyle} onValueChange={(value) => setFormData({ ...formData, contactStyle: value })}>
                <SelectTrigger className="bg-input">
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {SURVEY_QUESTIONS.contactStyle.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{SURVEY_QUESTIONS.conflictStyle.question}</Label>
              <Select value={formData.conflictStyle} onValueChange={(value) => setFormData({ ...formData, conflictStyle: value })}>
                <SelectTrigger className="bg-input">
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {SURVEY_QUESTIONS.conflictStyle.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{SURVEY_QUESTIONS.spending.question}</Label>
              <Select value={formData.spending} onValueChange={(value) => setFormData({ ...formData, spending: value })}>
                <SelectTrigger className="bg-input">
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {SURVEY_QUESTIONS.spending.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                이전
              </Button>
              <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                다음
              </Button>
            </div>
          </form>
        )}

        {/* Step 4: Phase 2. 매칭 조건 (My Type) */}
        {step === 4 && (
          <form onSubmit={handleStep4Submit} className="space-y-4 mt-4">
            <h3 className="font-semibold text-center">Phase 2. 매칭 조건 (My Type)</h3>

            <div className="space-y-2">
              <Label>{SURVEY_QUESTIONS.priority.question}</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger className="bg-input">
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {SURVEY_QUESTIONS.priority.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{SURVEY_QUESTIONS.agePreference.question}</Label>
              <div className="space-y-2">
                {SURVEY_QUESTIONS.agePreference.options.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`age-${opt.value}`}
                      checked={formData.agePreference.includes(opt.value)}
                      onCheckedChange={() =>
                        setFormData({
                          ...formData,
                          agePreference: toggleArrayItem(formData.agePreference, opt.value),
                        })
                      }
                    />
                    <label htmlFor={`age-${opt.value}`} className="text-sm cursor-pointer">
                      {opt.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{SURVEY_QUESTIONS.distancePreference.question}</Label>
              <Select value={formData.distancePreference} onValueChange={(value) => setFormData({ ...formData, distancePreference: value })}>
                <SelectTrigger className="bg-input">
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {SURVEY_QUESTIONS.distancePreference.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(3)} className="flex-1">
                이전
              </Button>
              <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                다음
              </Button>
            </div>
          </form>
        )}

        {/* Step 5: Phase 3. 현실 필터 (The Real Deal) */}
        {step === 5 && (
          <form onSubmit={handleStep5Submit} className="space-y-6 mt-4">
            <h3 className="font-semibold text-center">Phase 3. 현실 필터 (The Real Deal)</h3>

            <div className="space-y-5">
              <div className="hidden sm:grid sm:grid-cols-[120px_1fr_1fr] text-xs text-muted-foreground text-center">
                <span />
                <span>나의 상태</span>
                <span>상대 허용 범위</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-[120px_1fr_1fr] sm:items-center">
                <p className="text-sm font-semibold sm:text-center">Q8. 흡연</p>
                <div className="space-y-2 sm:space-y-0 sm:flex sm:justify-center">
                  <Label className="sm:hidden">{SURVEY_QUESTIONS.smokingSelf.question}</Label>
                  <Select
                    value={formData.smokingSelf}
                    onValueChange={(value) => setFormData({ ...formData, smokingSelf: value })}
                  >
                    <SelectTrigger className="bg-input h-10 sm:w-56">
                      <SelectValue placeholder="선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {SURVEY_QUESTIONS.smokingSelf.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:space-y-0 sm:flex sm:justify-center">
                  <Label className="sm:hidden">{SURVEY_QUESTIONS.smokingPartner.question}</Label>
                  <Select
                    value={formData.smokingPartner}
                    onValueChange={(value) => setFormData({ ...formData, smokingPartner: value })}
                  >
                    <SelectTrigger className="bg-input h-10 sm:w-56">
                      <SelectValue placeholder="선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {SURVEY_QUESTIONS.smokingPartner.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[120px_1fr_1fr] sm:items-center">
                <p className="text-sm font-semibold sm:text-center">Q9. 음주</p>
                <div className="space-y-2 sm:space-y-0 sm:flex sm:justify-center">
                  <Label className="sm:hidden">{SURVEY_QUESTIONS.drinkingSelf.question}</Label>
                  <Select
                    value={formData.drinkingSelf}
                    onValueChange={(value) => setFormData({ ...formData, drinkingSelf: value })}
                  >
                    <SelectTrigger className="bg-input h-10 sm:w-56">
                      <SelectValue placeholder="선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {SURVEY_QUESTIONS.drinkingSelf.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:space-y-0 sm:flex sm:justify-center">
                  <Label className="sm:hidden">{SURVEY_QUESTIONS.drinkingPartner.question}</Label>
                  <Select
                    value={formData.drinkingPartner}
                    onValueChange={(value) => setFormData({ ...formData, drinkingPartner: value })}
                  >
                    <SelectTrigger className="bg-input h-10 sm:w-56">
                      <SelectValue placeholder="선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {SURVEY_QUESTIONS.drinkingPartner.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[120px_1fr_1fr] sm:items-center">
                <p className="text-sm font-semibold sm:text-center">Q10. 종교</p>
                <div className="space-y-2 sm:space-y-0 sm:flex sm:justify-center">
                  <Label className="sm:hidden">{SURVEY_QUESTIONS.religionSelf.question}</Label>
                  <Select
                    value={formData.religionSelf}
                    onValueChange={(value) => setFormData({ ...formData, religionSelf: value })}
                  >
                    <SelectTrigger className="bg-input h-10 sm:w-56">
                      <SelectValue placeholder="선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {SURVEY_QUESTIONS.religionSelf.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:space-y-0 sm:flex sm:justify-center">
                  <Label className="sm:hidden">{SURVEY_QUESTIONS.religionPartner.question}</Label>
                  <Select
                    value={formData.religionPartner}
                    onValueChange={(value) => setFormData({ ...formData, religionPartner: value })}
                  >
                    <SelectTrigger className="bg-input h-10 sm:w-56">
                      <SelectValue placeholder="선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {SURVEY_QUESTIONS.religionPartner.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[120px_1fr_1fr] sm:items-center">
                <p className="text-sm font-semibold sm:text-center">Q11. 반려동물</p>
                <div className="space-y-2 sm:space-y-0 sm:flex sm:justify-center">
                  <Label className="sm:hidden">{SURVEY_QUESTIONS.petSelf.question}</Label>
                  <Select
                    value={formData.petSelf}
                    onValueChange={(value) => setFormData({ ...formData, petSelf: value })}
                  >
                    <SelectTrigger className="bg-input h-10 sm:w-56">
                      <SelectValue placeholder="선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {SURVEY_QUESTIONS.petSelf.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:space-y-0 sm:flex sm:justify-center">
                  <Label className="sm:hidden">{SURVEY_QUESTIONS.petPartner.question}</Label>
                  <Select
                    value={formData.petPartner}
                    onValueChange={(value) => setFormData({ ...formData, petPartner: value })}
                  >
                    <SelectTrigger className="bg-input h-10 sm:w-56">
                      <SelectValue placeholder="선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {SURVEY_QUESTIONS.petPartner.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(4)} className="flex-1">
                이전
              </Button>
              <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                다음
              </Button>
            </div>
          </form>
        )}

        {/* Step 6: Phase 4. 관심사 태그 (Talk Topics) */}
        {step === 6 && (
          <form onSubmit={handleStep6Submit} className="space-y-4 mt-4">
            <h3 className="font-semibold text-center">Phase 4. 관심사 태그 (Talk Topics)</h3>

            <div className="space-y-2">
              <Label>{SURVEY_QUESTIONS.interests.question} (최대 5개)</Label>
              <div className="grid grid-cols-2 gap-2">
                {SURVEY_QUESTIONS.interests.options.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`interest-${opt.value}`}
                      checked={formData.interests.includes(opt.value)}
                      onCheckedChange={() => {
                        if (formData.interests.includes(opt.value)) {
                          setFormData({
                            ...formData,
                            interests: formData.interests.filter((i) => i !== opt.value),
                          })
                        } else if (formData.interests.length < 5) {
                          setFormData({
                            ...formData,
                            interests: [...formData.interests, opt.value],
                          })
                        }
                      }}
                      disabled={!formData.interests.includes(opt.value) && formData.interests.length >= 5}
                    />
                    <label htmlFor={`interest-${opt.value}`} className="text-sm cursor-pointer">
                      {opt.label}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{formData.interests.length}/5 선택됨</p>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(5)} className="flex-1">
                이전
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    가입 중...
                  </>
                ) : (
                  "가입하기"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
