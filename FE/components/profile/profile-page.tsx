"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Loader2, X } from "lucide-react"
import { SURVEY_QUESTIONS } from "@/lib/survey-questions"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { StepProgress } from "@/components/auth/register/step-progress"
import { RadioGroupField } from "@/components/auth/register/radio-group-field"
import { CheckboxGroupField } from "@/components/auth/register/checkbox-group-field"
import { getMySurvey, updateMyProfile, updateMySurvey } from "@/lib/api/user"
import { getLoveDnaImage } from "@/lib/profile-image"

const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
]

const REGIONS = [
  "서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산",
  "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
]

export function ProfilePage() {
  const { user, updateUser, deleteAccount } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null)
  const [checkingNickname, setCheckingNickname] = useState(false)
  const [editingBasic, setEditingBasic] = useState(false)

  const NICKNAME_MAX_LENGTH = 10
  const NICKNAME_PATTERN = /^[A-Za-z0-9가-힣]{1,10}$/
  const normalizeNickname = (value: string) => value.replace(/[^A-Za-z0-9가-힣]/g, "").slice(0, NICKNAME_MAX_LENGTH)
  const [editingSurvey, setEditingSurvey] = useState(false)
  const [surveyStep, setSurveyStep] = useState(1)
  const SURVEY_TOTAL_STEPS = 4
  // birthDate 파싱 (예: "1995-03-15" -> year, month, day)
  const parseBirthDate = (birthDate?: string) => {
    if (!birthDate) return { year: "", month: "", day: "" }
    const parts = birthDate.split("-")
    return {
      year: parts[0] || "",
      month: parts[1] ? parseInt(parts[1]).toString() : "",
      day: parts[2] ? parseInt(parts[2]).toString() : "",
    }
  }
  const initialBirth = parseBirthDate(user?.birthDate)
  const initialBirthInput = initialBirth.year && initialBirth.month && initialBirth.day
    ? `${initialBirth.year.slice(-2)}${initialBirth.month.padStart(2, "0")}${initialBirth.day.padStart(2, "0")}`
    : ""
  const [birthInput, setBirthInput] = useState(initialBirthInput)
  const [birthError, setBirthError] = useState("")

  const [basicData, setBasicData] = useState({
    nickname: user?.nickname || "",
    bio: user?.bio || "",
    mbti: user?.mbti || "",
    birthYear: initialBirth.year,
    birthMonth: initialBirth.month,
    birthDay: initialBirth.day,
    gender: user?.gender || "",
    region: user?.region || "",
    interests: user?.surveyData?.interests || [] as string[],
  })

  const [surveyData, setSurveyData] = useState<{
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
    interests: string[]
  }>({
    dateStyle: user?.surveyData?.dateStyle || "",
    contactStyle: user?.surveyData?.contactStyle || "",
    conflictStyle: user?.surveyData?.conflictStyle || "",
    spending: user?.surveyData?.spending || "",
    priority: user?.surveyData?.priority || "",
    agePreference: user?.surveyData?.agePreference || [],
    distancePreference: user?.surveyData?.distancePreference || "",
    smokingSelf: user?.surveyData?.smokingSelf || "",
    smokingPartner: user?.surveyData?.smokingPartner || "",
    drinkingSelf: user?.surveyData?.drinkingSelf || "",
    drinkingPartner: user?.surveyData?.drinkingPartner || "",
    religionSelf: user?.surveyData?.religionSelf || "",
    religionPartner: user?.surveyData?.religionPartner || "",
    petSelf: user?.surveyData?.petSelf || "",
    petPartner: user?.surveyData?.petPartner || "",
    interests: user?.surveyData?.interests || [],
  })

  useEffect(() => {
    if (user) {
      const birth = parseBirthDate(user.birthDate)
      setBasicData({
        nickname: user.nickname || "",
        bio: user.bio || "",
        mbti: user.mbti || "",
        birthYear: birth.year,
        birthMonth: birth.month,
        birthDay: birth.day,
        gender: user.gender || "",
        region: user.region || "",
        interests: user.surveyData?.interests || [],
      })
      setBirthInput(
        birth.year && birth.month && birth.day
          ? `${birth.year.slice(-2)}${birth.month.padStart(2, "0")}${birth.day.padStart(2, "0")}`
          : ""
      )
      setBirthError("")
      if (user.surveyData) {
        setSurveyData({
          dateStyle: user.surveyData.dateStyle || "",
          contactStyle: user.surveyData.contactStyle || "",
          conflictStyle: user.surveyData.conflictStyle || "",
          spending: user.surveyData.spending || "",
          priority: user.surveyData.priority || "",
          agePreference: user.surveyData.agePreference || [],
          distancePreference: user.surveyData.distancePreference || "",
          smokingSelf: user.surveyData.smokingSelf || "",
          smokingPartner: user.surveyData.smokingPartner || "",
          drinkingSelf: user.surveyData.drinkingSelf || "",
          drinkingPartner: user.surveyData.drinkingPartner || "",
          religionSelf: user.surveyData.religionSelf || "",
          religionPartner: user.surveyData.religionPartner || "",
          petSelf: user.surveyData.petSelf || "",
          petPartner: user.surveyData.petPartner || "",
          interests: user.surveyData.interests || [],
        })
      }
    }
  }, [user])

  useEffect(() => {
    const fetchSurvey = async () => {
      if (!user) return
      try {
        const fetchedSurvey = await getMySurvey()
        setSurveyData((prev) => ({
          ...prev,
          ...fetchedSurvey,
          interests: user.surveyData?.interests || prev.interests || [],
        }))
      } catch (error) {
        console.error("설문조사 조회 실패:", error)
      }
    }

    fetchSurvey()
  }, [user])

  useEffect(() => {
    if (!showDeleteConfirm) {
      setDeletePassword("")
    }
  }, [showDeleteConfirm])


  const checkNickname = async () => {
    const nickname = basicData.nickname.trim()
    if (nickname.length < 2) {
      toast({
        title: "닉네임 오류",
        description: "닉네임은 2자 이상이어야 합니다.",
        variant: "destructive",
      })
      return
    }
    if (nickname.length > 10) {
      toast({
        title: "닉네임 오류",
        description: "닉네임은 최대 10자까지 입력할 수 있습니다.",
        variant: "destructive",
      })
      return
    }
    if (!NICKNAME_PATTERN.test(nickname)) {
      toast({
        title: "닉네임 오류",
        description: "닉네임은 한글/영문/숫자만 사용할 수 있습니다.",
        variant: "destructive",
      })
      return
    }

    if (basicData.nickname === (user?.nickname || "")) {
      setNicknameAvailable(true)
      return
    }

    setCheckingNickname(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    setNicknameAvailable(basicData.nickname !== "테스트")
    setCheckingNickname(false)
  }

  const normalizeBirthValue = (value: string) => value.replace(/\D/g, "").slice(0, 6)

  const getFullYear = (twoDigitYear: number) => {
    const currentYear = new Date().getFullYear()
    const cutoff = currentYear % 100
    return twoDigitYear <= cutoff ? 2000 + twoDigitYear : 1900 + twoDigitYear
  }

  const parseBirthInput = (input: string) => {
    const yy = Number.parseInt(input.slice(0, 2), 10)
    const mm = Number.parseInt(input.slice(2, 4), 10)
    const dd = Number.parseInt(input.slice(4, 6), 10)
    if (Number.isNaN(yy) || Number.isNaN(mm) || Number.isNaN(dd)) {
      return null
    }
    const year = getFullYear(yy)
    return { year, month: mm, day: dd }
  }

  const getBirthError = (input: string, allowPartial: boolean) => {
    if (!input) {
      return allowPartial ? "" : "생년월일 6자리를 입력해주세요."
    }

    if (input.length < 6) {
      return "생년월일 6자리를 입력해주세요."
    }

    const month = Number.parseInt(input.slice(2, 4), 10)
    if (Number.isNaN(month) || month < 1 || month > 12) {
      return "월은 1부터 12 사이여야 합니다."
    }

    const day = Number.parseInt(input.slice(4, 6), 10)
    if (Number.isNaN(day) || day < 1 || day > 31) {
      return "일은 1부터 31 사이여야 합니다."
    }

    const parsed = parseBirthInput(input)
    if (!parsed || parsed.year < 1900) {
      return "생년은 1900년 이후로 입력해주세요."
    }

    const date = new Date(parsed.year, parsed.month - 1, parsed.day)
    if (date.getFullYear() !== parsed.year || date.getMonth() !== parsed.month - 1 || date.getDate() !== parsed.day) {
      return "유효한 날짜를 입력해주세요."
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date > today) {
      return "미래 날짜는 입력할 수 없습니다."
    }

    return ""
  }

  const handleBirthChange = (value: string) => {
    const nextValue = normalizeBirthValue(value)
    setBirthInput(nextValue)
    const error = getBirthError(nextValue, true)
    setBirthError(error)

    if (nextValue.length === 6 && !error) {
      const parsed = parseBirthInput(nextValue)
      if (parsed) {
        setBasicData((prev) => ({
          ...prev,
          birthYear: parsed.year.toString(),
          birthMonth: parsed.month.toString(),
          birthDay: parsed.day.toString(),
        }))
      }
    } else {
      setBasicData((prev) => ({
        ...prev,
        birthYear: "",
        birthMonth: "",
        birthDay: "",
      }))
    }
  }

  const handleSaveBasic = async () => {
    const nickname = basicData.nickname.trim()
    if (nickname.length < 2) {
      toast({
        title: "닉네임 오류",
        description: "닉네임은 2자 이상이어야 합니다.",
        variant: "destructive",
      })
      return
    }
    if (nickname.length > 10) {
      toast({
        title: "닉네임 오류",
        description: "닉네임은 최대 10자까지 입력할 수 있습니다.",
        variant: "destructive",
      })
      return
    }
    if (!NICKNAME_PATTERN.test(nickname)) {
      toast({
        title: "닉네임 오류",
        description: "닉네임은 한글/영문/숫자만 사용할 수 있습니다.",
        variant: "destructive",
      })
      return
    }

    const birthErrorMessage = getBirthError(birthInput, false)
    if (birthErrorMessage) {
      setBirthError(birthErrorMessage)
      toast({
        title: "생년월일 오류",
        description: birthErrorMessage,
        variant: "destructive",
      })
      return
    }

    if (basicData.nickname !== (user?.nickname || "") && nicknameAvailable !== true) {
      toast({
        title: "닉네임 확인 필요",
        description: "닉네임 중복 확인을 해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // birthDate 포맷팅 및 데이터 변환
      const birthDate = basicData.birthYear && basicData.birthMonth && basicData.birthDay
        ? `${basicData.birthYear}-${basicData.birthMonth.padStart(2, '0')}-${basicData.birthDay.padStart(2, '0')}`
        : undefined

      const updatedUser = await updateMyProfile({
        nickname: basicData.nickname,
        intro: basicData.bio,
        mbti: basicData.mbti,
        birthDate,
        gender: basicData.gender as "male" | "female",
        region: basicData.region,
        interestTags: basicData.interests,
      })

      updateUser(updatedUser)
      setEditingBasic(false)
      setNicknameAvailable(null)

      toast({
        title: "프로필 수정 완료",
        description: "기본 정보가 성공적으로 업데이트되었습니다.",
      })
    } catch (error) {
      toast({
        title: "프로필 수정 실패",
        description: error instanceof Error ? error.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetBasicEdit = () => {
    const birth = parseBirthDate(user?.birthDate)
    setBasicData({
      nickname: user?.nickname || "",
      bio: user?.bio || "",
      mbti: user?.mbti || "",
      birthYear: birth.year,
      birthMonth: birth.month,
      birthDay: birth.day,
      gender: user?.gender || "",
      region: user?.region || "",
      interests: user?.surveyData?.interests || [],
    })
    setBirthInput(
      birth.year && birth.month && birth.day
        ? `${birth.year.slice(-2)}${birth.month.padStart(2, "0")}${birth.day.padStart(2, "0")}`
        : ""
    )
    setBirthError("")
    setNicknameAvailable(null)
    setCheckingNickname(false)
    setEditingBasic(false)
  }


  const handleSaveSurvey = async () => {
    if (
      !surveyData.dateStyle ||
      !surveyData.contactStyle ||
      !surveyData.conflictStyle ||
      !surveyData.spending ||
      !surveyData.priority ||
      surveyData.agePreference.length === 0 ||
      !surveyData.distancePreference ||
      !surveyData.smokingSelf ||
      !surveyData.smokingPartner ||
      !surveyData.drinkingSelf ||
      !surveyData.drinkingPartner ||
      !surveyData.religionSelf ||
      !surveyData.religionPartner ||
      !surveyData.petSelf ||
      !surveyData.petPartner
    ) {
      toast({
        title: "선택 필요",
        description: "모든 항목에 1가지 이상 응답해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const updatedSurvey = await updateMySurvey(surveyData)
      updateUser({
        surveyData: {
          ...updatedSurvey,
          interests: surveyData.interests,
        },
      })
      setSurveyStep(1)
      setEditingSurvey(false)

      toast({
        title: "설문조사 수정 완료",
        description: "설문 응답이 성공적으로 업데이트되었습니다.",
      })
    } catch (error) {
      toast({
        title: "설문조사 수정 실패",
        description: error instanceof Error ? error.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetSurveyEdit = () => {
    if (user?.surveyData) {
      setSurveyData({
        dateStyle: user.surveyData.dateStyle || "",
        contactStyle: user.surveyData.contactStyle || "",
        conflictStyle: user.surveyData.conflictStyle || "",
        spending: user.surveyData.spending || "",
        priority: user.surveyData.priority || "",
        agePreference: user.surveyData.agePreference || [],
        distancePreference: user.surveyData.distancePreference || "",
        smokingSelf: user.surveyData.smokingSelf || "",
        smokingPartner: user.surveyData.smokingPartner || "",
        drinkingSelf: user.surveyData.drinkingSelf || "",
        drinkingPartner: user.surveyData.drinkingPartner || "",
        religionSelf: user.surveyData.religionSelf || "",
        religionPartner: user.surveyData.religionPartner || "",
        petSelf: user.surveyData.petSelf || "",
        petPartner: user.surveyData.petPartner || "",
        interests: user.surveyData.interests || [],
      })
    }
    setSurveyStep(1)
    setEditingSurvey(false)
  }

  const handleDelete = async () => {
    if (!deletePassword) {
      toast({
        title: "입력 필요",
        description: "비밀번호를 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    const success = await deleteAccount(deletePassword)
    setIsLoading(false)

    if (!success) {
      toast({
        title: "계정삭제 실패",
        description: "비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "계정 삭제 완료",
      description: "그동안 이용해주셔서 감사합니다.",
    })
    setShowDeleteConfirm(false)
  }

  const getTemperatureColor = (clarity: number) => {
    return "text-primary"
  }

  const selectedInterestLabels = SURVEY_QUESTIONS.interests.options
    .filter((option) => surveyData.interests.includes(option.value))
    .map((option) => option.label)

  const profileImage = getLoveDnaImage(user?.loveDna)

  return (
    <>
      <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold">마이페이지</h1>
              <p className="text-muted-foreground text-sm">내 정보를 관리하고 수정하세요</p>
            </div>

        <div className="flex flex-col gap-4">
          {/* Profile Summary & Basic Info */}
          <Card className="gap-0 py-0">
            <CardContent className="p-5">
              {/* 상단: 아바타 + 닉네임/온도 + 수정 버튼 */}
              <div className="flex items-center gap-4 pb-4">
                <img
                  src={profileImage}
                  alt={`${user?.nickname ?? "사용자"} 프로필 이미지`}
                  className="w-14 h-14 rounded-full object-cover bg-card flex-shrink-0"
                />
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{user?.nickname}</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-sm font-medium ${getTemperatureColor(user?.temperature ?? 50)}`}>
                      {Math.round(user?.temperature || 0)}%
                    </span>
                    <span className="text-xs text-muted-foreground">선명도</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-foreground self-start"
                  onClick={() => {
                    setNicknameAvailable(null)
                    setEditingBasic(true)
                  }}
                >
                  수정하기
                </button>
              </div>

              {/* 기본 정보 그리드 */}
              <div className="grid grid-cols-3 gap-y-3 gap-x-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground mb-0.5">나이</p>
                  <p className="text-base font-medium">{user?.age}세</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-0.5">성별</p>
                  <p className="text-base font-medium">{user?.gender === "male" ? "남성" : "여성"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-0.5">지역</p>
                  <p className="text-base font-medium">{user?.region || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-0.5">MBTI</p>
                  <p className="text-base font-medium">{user?.mbti || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground mb-0.5">한 줄 소개</p>
                  <p className="text-base font-medium truncate">{user?.bio || "-"}</p>
                </div>
                <div className="col-span-3 mt-1">
                  <p className="text-sm text-muted-foreground mb-1.5">관심사</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedInterestLabels.length > 0 ? (
                      selectedInterestLabels.map((label) => (
                        <Badge key={label} variant="secondary">
                          {label}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">선택한 관심사 없음</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Survey Data Card */}
          <Card className="gap-0 py-0">
            <CardHeader className="py-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <CardTitle className="text-lg">성향 & 선호도</CardTitle>
                  <CardDescription>회원가입 시 작성한 설문조사</CardDescription>
                </div>
                {!editingSurvey && (
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setEditingSurvey(true)}
                  >
                    수정하기
                  </button>
                )}
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* 계정 삭제 */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-xs text-red-500 hover:text-red-600 hover:underline"
          >
            계정 삭제
          </button>
        </div>

      </div>

      {/* Edit Basic Info Dialog */}
      <Dialog open={editingBasic} onOpenChange={(open) => {
        if (!open) {
          resetBasicEdit()
          return
        }
        setEditingBasic(true)
      }}>
        <DialogContent className="sm:max-w-md bg-background max-h-[85vh] overflow-hidden p-0">
          <div className="overflow-y-auto max-h-[85vh] custom-scrollbar p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">기본 정보 수정</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
            {/* 닉네임 */}
            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임</Label>
              <div className="flex gap-2">
                <Input
                  id="nickname"
                  placeholder="한글/영문/숫자만, 최대 10자"
                  value={basicData.nickname}
                  onChange={(e) => {
                    const newValue = normalizeNickname(e.target.value)
                    setBasicData({ ...basicData, nickname: newValue })
                    setNicknameAvailable(null)
                  }}
                  className="flex-1 border-2 border-gray-200"
                  maxLength={NICKNAME_MAX_LENGTH}
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

            {/* 생년월일 */}
            <div className="space-y-2">
              <Label>생년월일</Label>
              <Input
                id="birth_str_edit"
                type="text"
                inputMode="numeric"
                placeholder="생년월일 6자리 (예: 980101)"
                value={birthInput}
                maxLength={6}
                onChange={(e) => handleBirthChange(e.target.value)}
                className="border-2 border-gray-200"
              />
              {birthError ? <p className="text-sm text-destructive">{birthError}</p> : null}
            </div>

            {/* 성별 */}
            <div className="space-y-2">
              <Label>성별</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={basicData.gender === "male" ? "default" : "outline"}
                  onClick={() => setBasicData({ ...basicData, gender: "male" })}
                  className={basicData.gender === "male" ? "bg-primary text-primary-foreground" : "border-2 border-gray-200"}
                >
                  남성
                </Button>
                <Button
                  type="button"
                  variant={basicData.gender === "female" ? "default" : "outline"}
                  onClick={() => setBasicData({ ...basicData, gender: "female" })}
                  className={basicData.gender === "female" ? "bg-primary text-primary-foreground" : "border-2 border-gray-200"}
                >
                  여성
                </Button>
              </div>
            </div>

            {/* 지역 */}
            <div className="space-y-2">
              <Label>지역</Label>
              <Select value={basicData.region} onValueChange={(value) => setBasicData({ ...basicData, region: value })}>
                <SelectTrigger className="border-2 border-gray-200">
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

            {/* MBTI */}
            <div className="space-y-2">
              <Label>MBTI</Label>
              <Select value={basicData.mbti} onValueChange={(value) => setBasicData({ ...basicData, mbti: value })}>
                <SelectTrigger className="border-2 border-gray-200">
                  <SelectValue placeholder="MBTI를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {MBTI_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 한 줄 소개 */}
            <div className="space-y-2">
              <Label htmlFor="bio">한 줄 소개</Label>
              <Textarea
                id="bio"
                placeholder="자신을 한 줄로 소개해보세요"
                value={basicData.bio}
                onChange={(e) => {
                  if (e.target.value.length <= 50) {
                    setBasicData({ ...basicData, bio: e.target.value })
                  }
                }}
                className="resize-none border-2 border-gray-200"
                rows={2}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground text-right">{basicData.bio.length}/50</p>
            </div>

            {/* 관심사 */}
            <CheckboxGroupField
              label="관심사 (최대 5개)"
              values={basicData.interests}
              options={SURVEY_QUESTIONS.interests.options}
              onChange={(values) => setBasicData({ ...basicData, interests: values })}
              fieldId="interests-edit"
              maxSelection={5}
              showCount={true}
              gridCols={2}
              className="grid grid-cols-2 gap-2"
            />

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={resetBasicEdit} className="flex-1 bg-transparent">
                <X className="w-4 h-4 mr-2" />
                취소
              </Button>
              <Button
                onClick={handleSaveBasic}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  "저장하기"
                )}
              </Button>
            </div>
          </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Survey Dialog - Step-based */}
      <Dialog open={editingSurvey} onOpenChange={(open) => {
        if (!open) {
          resetSurveyEdit()
          setSurveyStep(1)
          return
        }
        setEditingSurvey(true)
      }}>
        <DialogContent className="sm:max-w-lg bg-background max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">성향 & 선호도 수정</DialogTitle>
            <StepProgress currentStep={surveyStep} totalSteps={SURVEY_TOTAL_STEPS} />
          </DialogHeader>

          {/* Step 1: 나의 분위기 (Vibe Check) */}
          {surveyStep === 1 && (
            <div className="space-y-10 mt-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-center">평소의 나는 어떤 사람인지 알려주세요!</h3>
                <p className="text-sm text-muted-foreground text-center">매칭시에 사용되는 정보입니다. 타인에게는 노출되지 않습니다.</p>
              </div>

              <RadioGroupField
                label={SURVEY_QUESTIONS.dateStyle.question}
                value={surveyData.dateStyle}
                options={SURVEY_QUESTIONS.dateStyle.options}
                onChange={(value) => setSurveyData({ ...surveyData, dateStyle: value })}
                fieldId="dateStyle-edit"
              />

              <RadioGroupField
                label={SURVEY_QUESTIONS.contactStyle.question}
                value={surveyData.contactStyle}
                options={SURVEY_QUESTIONS.contactStyle.options}
                onChange={(value) => setSurveyData({ ...surveyData, contactStyle: value })}
                fieldId="contactStyle-edit"
              />

              <RadioGroupField
                label={SURVEY_QUESTIONS.conflictStyle.question}
                value={surveyData.conflictStyle}
                options={SURVEY_QUESTIONS.conflictStyle.options}
                onChange={(value) => setSurveyData({ ...surveyData, conflictStyle: value })}
                fieldId="conflictStyle-edit"
              />

              <RadioGroupField
                label={SURVEY_QUESTIONS.spending.question}
                value={surveyData.spending}
                options={SURVEY_QUESTIONS.spending.options}
                onChange={(value) => setSurveyData({ ...surveyData, spending: value })}
                fieldId="spending-edit"
              />

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { resetSurveyEdit(); setSurveyStep(1) }} className="flex-1">
                  취소
                </Button>
                <Button
                  onClick={() => setSurveyStep(2)}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  다음
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: 매칭 조건 (My Type) */}
          {surveyStep === 2 && (
            <div className="space-y-10 mt-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-center">매칭됐으면 하는 상대의 조건을 알려주세요!</h3>
                <p className="text-sm text-muted-foreground text-center">매칭시에 사용되는 정보입니다. 타인에게는 노출되지 않습니다.</p>
              </div>

              <RadioGroupField
                label={SURVEY_QUESTIONS.priority.question}
                value={surveyData.priority}
                options={SURVEY_QUESTIONS.priority.options}
                onChange={(value) => setSurveyData({ ...surveyData, priority: value })}
                fieldId="priority-edit"
              />

              <CheckboxGroupField
                label={SURVEY_QUESTIONS.agePreference.question}
                values={surveyData.agePreference}
                options={SURVEY_QUESTIONS.agePreference.options}
                onChange={(values) => setSurveyData({ ...surveyData, agePreference: values })}
                fieldId="age-edit"
              />

              <RadioGroupField
                label={SURVEY_QUESTIONS.distancePreference.question}
                value={surveyData.distancePreference}
                options={SURVEY_QUESTIONS.distancePreference.options}
                onChange={(value) => setSurveyData({ ...surveyData, distancePreference: value })}
                fieldId="distancePreference-edit"
              />

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setSurveyStep(1)} className="flex-1">
                  이전
                </Button>
                <Button
                  onClick={() => setSurveyStep(3)}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  다음
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: 나의 상태 (The Real Deal - Self) */}
          {surveyStep === 3 && (
            <div className="space-y-10 mt-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-center">나는 어떤 사람인지 알려주세요!</h3>
                <p className="text-sm text-muted-foreground text-center">매칭시에 사용되는 정보입니다. 타인에게는 노출되지 않습니다.</p>
              </div>

              <RadioGroupField
                label={SURVEY_QUESTIONS.smokingSelf.question}
                value={surveyData.smokingSelf}
                options={SURVEY_QUESTIONS.smokingSelf.options}
                onChange={(value) => setSurveyData({ ...surveyData, smokingSelf: value })}
                fieldId="smokingSelf-edit"
              />

              <RadioGroupField
                label={SURVEY_QUESTIONS.drinkingSelf.question}
                value={surveyData.drinkingSelf}
                options={SURVEY_QUESTIONS.drinkingSelf.options}
                onChange={(value) => setSurveyData({ ...surveyData, drinkingSelf: value })}
                fieldId="drinkingSelf-edit"
              />

              <RadioGroupField
                label={SURVEY_QUESTIONS.religionSelf.question}
                value={surveyData.religionSelf}
                options={SURVEY_QUESTIONS.religionSelf.options}
                onChange={(value) => setSurveyData({ ...surveyData, religionSelf: value })}
                fieldId="religionSelf-edit"
              />

              <RadioGroupField
                label={SURVEY_QUESTIONS.petSelf.question}
                value={surveyData.petSelf}
                options={SURVEY_QUESTIONS.petSelf.options}
                onChange={(value) => setSurveyData({ ...surveyData, petSelf: value })}
                fieldId="petSelf-edit"
              />

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setSurveyStep(2)} className="flex-1">
                  이전
                </Button>
                <Button
                  onClick={() => setSurveyStep(4)}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  다음
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: 상대 허용범위 (The Real Deal - Partner) */}
          {surveyStep === 4 && (
            <div className="space-y-10 mt-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-center">매칭됐으면 하는 상대의 조건을 알려주세요!</h3>
                <p className="text-sm text-muted-foreground text-center">매칭시에 사용되는 정보입니다. 타인에게는 노출되지 않습니다.</p>
              </div>

              <RadioGroupField
                label={SURVEY_QUESTIONS.smokingPartner.question}
                value={surveyData.smokingPartner}
                options={SURVEY_QUESTIONS.smokingPartner.options}
                onChange={(value) => setSurveyData({ ...surveyData, smokingPartner: value })}
                fieldId="smokingPartner-edit"
              />

              <RadioGroupField
                label={SURVEY_QUESTIONS.drinkingPartner.question}
                value={surveyData.drinkingPartner}
                options={SURVEY_QUESTIONS.drinkingPartner.options}
                onChange={(value) => setSurveyData({ ...surveyData, drinkingPartner: value })}
                fieldId="drinkingPartner-edit"
              />

              <RadioGroupField
                label={SURVEY_QUESTIONS.religionPartner.question}
                value={surveyData.religionPartner}
                options={SURVEY_QUESTIONS.religionPartner.options}
                onChange={(value) => setSurveyData({ ...surveyData, religionPartner: value })}
                fieldId="religionPartner-edit"
              />

              <RadioGroupField
                label={SURVEY_QUESTIONS.petPartner.question}
                value={surveyData.petPartner}
                options={SURVEY_QUESTIONS.petPartner.options}
                onChange={(value) => setSurveyData({ ...surveyData, petPartner: value })}
                fieldId="petPartner-edit"
              />

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setSurveyStep(3)} className="flex-1">
                  이전
                </Button>
                <Button
                  onClick={handleSaveSurvey}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    "저장하기"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-sm bg-background">
          <DialogHeader className="pb-1">
            <DialogTitle className="text-center text-base font-medium text-muted-foreground">계정 삭제</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <h3 className="text-lg font-semibold mb-2">정말 탈퇴하시겠어요?</h3>
            <p className="text-muted-foreground text-sm mb-6">탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.</p>
            <div className="space-y-2 text-left mb-6">
              <Label htmlFor="delete-password">비밀번호</Label>
              <Input
                id="delete-password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="bg-input"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
                취소
              </Button>
              <Button variant="destructive" onClick={handleDelete} className="flex-1" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "탈퇴하기"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
