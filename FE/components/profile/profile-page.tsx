"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Loader2, User, Trash2, Pencil, Save, X } from "lucide-react"
import { SURVEY_QUESTIONS } from "@/lib/survey-questions"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
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
  const [editingSurvey, setEditingSurvey] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  
  const [basicData, setBasicData] = useState({
    nickname: user?.nickname || "",
    bio: user?.bio || "",
    mbti: user?.mbti || "",
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
      setBasicData({
        nickname: user.nickname || "",
        bio: user.bio || "",
        mbti: user.mbti || "",
      })
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
    if (!showDeleteConfirm) {
      setDeletePassword("")
    }
  }, [showDeleteConfirm])

  const checkNickname = async () => {
    if (basicData.nickname.trim().length < 2) {
      toast({
        title: "닉네임 오류",
        description: "닉네임은 2자 이상이어야 합니다.",
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

  const handleSaveBasic = async () => {
    if (basicData.nickname !== (user?.nickname || "") && nicknameAvailable !== true) {
      toast({
        title: "닉네임 확인 필요",
        description: "닉네임 중복 확인을 해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))

    updateUser(basicData)
    setIsLoading(false)
    setEditingBasic(false)
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
    setNicknameAvailable(null)

    toast({
      title: "프로필 수정 완료",
      description: "기본 정보가 성공적으로 업데이트되었습니다.",
    })
  }

  const resetBasicEdit = () => {
    setBasicData({
      nickname: user?.nickname || "",
      bio: user?.bio || "",
      mbti: user?.mbti || "",
    })
    setNicknameAvailable(null)
    setCheckingNickname(false)
    setEditingBasic(false)
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
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
      !surveyData.petPartner ||
      surveyData.interests.length === 0
    ) {
      toast({
        title: "선택 필요",
        description: "모든 항목에 1가지 이상 응답해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))

    updateUser({ surveyData })
    setIsLoading(false)
    setEditingSurvey(false)

    toast({
      title: "설문조사 수정 완료",
      description: "설문 응답이 성공적으로 업데이트되었습니다.",
    })
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
    setEditingSurvey(false)
  }


  const handleDelete = async () => {
    if (!deletePassword) {
      toast({
        title: "?? ??",
        description: "????? ??????.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    const success = await deleteAccount(deletePassword)
    setIsLoading(false)

    if (!success) {
      toast({
        title: "???? ??",
        description: "????? ???? ????.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "?? ?? ??",
      description: "??? ????? ???????.",
    })
    setShowDeleteConfirm(false)
  }

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter((i) => i !== item)
    }
    return [...array, item]
  }

  const getTemperatureColor = (temp: number) => {
    if (temp >= 40) return "text-red-500"
    if (temp >= 38) return "text-orange-500"
    if (temp >= 36) return "text-green-500"
    if (temp >= 34) return "text-blue-500"
    return "text-blue-700"
  }

  const getAnswerLabel = (questionKey: string, value: string | string[]) => {
    const question = SURVEY_QUESTIONS[questionKey as keyof typeof SURVEY_QUESTIONS]
    if (!question) return value

    if (Array.isArray(value)) {
      return value
        .map((v) => question.options.find((opt) => opt.value === v)?.label || v)
        .join(", ")
    }

    return question.options.find((opt) => opt.value === value)?.label || value
  }

  const selectedInterestLabels = SURVEY_QUESTIONS.interests.options
    .filter((option) => surveyData.interests.includes(option.value))
    .map((option) => option.label)


  return (
    <>
      <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold">마이페이지</h1>
              <p className="text-muted-foreground text-sm">내 정보를 관리하고 수정하세요</p>
            </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr] items-stretch">
          {/* Profile Summary */}
          <Card className="py-4 lg:h-full lg:self-stretch">
            <CardContent className="pt-6 lg:h-full flex flex-col justify-center">
              <div className="flex flex-col items-center text-center gap-5">
                <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-12 h-12 text-primary" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold">{user?.nickname}</h2>
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span>{user?.age}세</span>
                    <span>{user?.gender === "male" ? "남성" : "여성"}</span>
                    <span>{user?.region}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`font-semibold ${getTemperatureColor(user?.temperature || 36.5)}`}>
                      {Math.round(user?.temperature || 0)}%
                    </span>
                    <span className="text-xs text-muted-foreground">선명도</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6 lg:space-y-0 lg:flex lg:flex-col lg:gap-6 lg:h-full">
            {/* Basic Info Card */}
            <Card className="gap-4">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>기본 정보</CardTitle>
                    <CardDescription>닉네임, 소개, MBTI</CardDescription>
                  </div>
                  {!editingBasic && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    })
                    setNicknameAvailable(null)
                    setEditingBasic(true)
                  }}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      수정
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">닉네임</p>
                    <p className="font-medium">{user?.nickname || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">한 줄 소개</p>
                    <p className="font-medium">{user?.bio || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">MBTI</p>
                    <p className="font-medium">{user?.mbti || "-"}</p>
                  </div>
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
              </CardContent>
            </Card>

            {/* Survey Data Card */}
            <Card className="gap-4">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>성향 & 선호도</CardTitle>
                    <CardDescription>회원가입 시 작성한 설문조사</CardDescription>
                  </div>
                  {!editingSurvey && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingSurvey(true)}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      수정
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-2" />
            </Card>
          </div>
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
        <DialogContent className="sm:max-w-lg bg-background max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">기본 정보 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임</Label>
              <div className="flex gap-2">
                <Input
                  id="nickname"
                  value={basicData.nickname}
                  onChange={(e) => {
                    setBasicData({ ...basicData, nickname: e.target.value })
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
              <Label htmlFor="bio">한 줄 소개</Label>
              <Textarea
                id="bio"
                placeholder="자신을 한 줄로 소개해보세요"
                value={basicData.bio}
                onChange={(e) => setBasicData({ ...basicData, bio: e.target.value })}
                className="bg-input resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>MBTI</Label>
              <Select value={basicData.mbti} onValueChange={(value) => setBasicData({ ...basicData, mbti: value })}>
                <SelectTrigger className="bg-input">
                  <SelectValue placeholder="선택하세요" />
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
            <div className="pt-4 border-t border-border space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">현재 비밀번호</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="현재 비밀번호를 입력하세요"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="bg-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">새 비밀번호</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="새 비밀번호를 입력하세요"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="bg-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="새 비밀번호를 다시 입력하세요"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="bg-input"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={resetBasicEdit} className="flex-1">
                <X className="w-4 h-4 mr-2" />
                취소
              </Button>
              <Button
                onClick={handleSaveBasic}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                저장
              </Button>
            </div>
            <div className="pt-4 border-t border-border flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-muted-foreground hover:text-destructive"
              >
                계정 삭제
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Survey Dialog */}
      <Dialog open={editingSurvey} onOpenChange={(open) => {
        if (!open) {
          resetSurveyEdit()
          return
        }
        setEditingSurvey(true)
      }}>
        <DialogContent className="sm:max-w-3xl bg-background max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">성향 & 선호도 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Phase 1. 나의 분위기 (Vibe Check)</h3>

              <div className="space-y-2">
                <Label>{SURVEY_QUESTIONS.dateStyle.question}</Label>
                <Select value={surveyData.dateStyle} onValueChange={(value) => setSurveyData({ ...surveyData, dateStyle: value })}>
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
                <Select value={surveyData.contactStyle} onValueChange={(value) => setSurveyData({ ...surveyData, contactStyle: value })}>
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
                <Select value={surveyData.conflictStyle} onValueChange={(value) => setSurveyData({ ...surveyData, conflictStyle: value })}>
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
                <Select value={surveyData.spending} onValueChange={(value) => setSurveyData({ ...surveyData, spending: value })}>
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
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Phase 2. 매칭 조건 (My Type)</h3>

              <div className="space-y-2">
                <Label>{SURVEY_QUESTIONS.priority.question}</Label>
                <Select value={surveyData.priority} onValueChange={(value) => setSurveyData({ ...surveyData, priority: value })}>
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
                        id={`age-edit-${opt.value}`}
                        checked={surveyData.agePreference.includes(opt.value)}
                        onCheckedChange={() =>
                          setSurveyData({
                            ...surveyData,
                            agePreference: toggleArrayItem(surveyData.agePreference, opt.value),
                          })
                        }
                      />
                      <label htmlFor={`age-edit-${opt.value}`} className="text-sm cursor-pointer">
                        {opt.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{SURVEY_QUESTIONS.distancePreference.question}</Label>
                <Select value={surveyData.distancePreference} onValueChange={(value) => setSurveyData({ ...surveyData, distancePreference: value })}>
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
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Phase 3. 현실 필터 (The Real Deal)</h3>

              <div className="space-y-3">
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
                      value={surveyData.smokingSelf}
                      onValueChange={(value) => setSurveyData({ ...surveyData, smokingSelf: value })}
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
                      value={surveyData.smokingPartner}
                      onValueChange={(value) => setSurveyData({ ...surveyData, smokingPartner: value })}
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
                      value={surveyData.drinkingSelf}
                      onValueChange={(value) => setSurveyData({ ...surveyData, drinkingSelf: value })}
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
                      value={surveyData.drinkingPartner}
                      onValueChange={(value) => setSurveyData({ ...surveyData, drinkingPartner: value })}
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
                      value={surveyData.religionSelf}
                      onValueChange={(value) => setSurveyData({ ...surveyData, religionSelf: value })}
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
                      value={surveyData.religionPartner}
                      onValueChange={(value) => setSurveyData({ ...surveyData, religionPartner: value })}
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
                      value={surveyData.petSelf}
                      onValueChange={(value) => setSurveyData({ ...surveyData, petSelf: value })}
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
                      value={surveyData.petPartner}
                      onValueChange={(value) => setSurveyData({ ...surveyData, petPartner: value })}
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
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Phase 4. 관심사 태그 (Talk Topics)</h3>

              <div className="space-y-2">
                <Label>{SURVEY_QUESTIONS.interests.question} (최대 5개)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SURVEY_QUESTIONS.interests.options.map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`interest-edit-${opt.value}`}
                        checked={surveyData.interests.includes(opt.value)}
                        onCheckedChange={() => {
                          if (surveyData.interests.includes(opt.value)) {
                            setSurveyData({
                              ...surveyData,
                              interests: surveyData.interests.filter((i) => i !== opt.value),
                            })
                          } else if (surveyData.interests.length < 5) {
                            setSurveyData({
                              ...surveyData,
                              interests: [...surveyData.interests, opt.value],
                            })
                          }
                        }}
                        disabled={!surveyData.interests.includes(opt.value) && surveyData.interests.length >= 5}
                      />
                      <label htmlFor={`interest-edit-${opt.value}`} className="text-sm cursor-pointer">
                        {opt.label}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{surveyData.interests.length}/5 선택됨</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={resetSurveyEdit} className="flex-1">
                <X className="w-4 h-4 mr-2" />
                취소
              </Button>
              <Button
                onClick={handleSaveSurvey}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                저장
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-sm bg-background">
          <DialogHeader>
            <DialogTitle className="text-center">계정 삭제</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
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
