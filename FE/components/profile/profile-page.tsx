"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Loader2, User, Trash2, Pencil, Save, X, Thermometer } from "lucide-react"
import { SURVEY_QUESTIONS } from "@/lib/survey-questions"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Header } from "@/components/common/header"
import { BackgroundLayout } from "@/components/common/background-layout"

interface ProfilePageProps {
  onBack?: () => void
  onHomeClick?: () => void
  onHistoryClick?: () => void
  onProfileClick?: () => void
  onMbtiClick?: () => void
  onLogout?: () => void
}

const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
]

export function ProfilePage({ 
  onBack, 
  onHomeClick, 
  onHistoryClick, 
  onProfileClick, 
  onMbtiClick, 
  onLogout 
}: ProfilePageProps) {
  const { user, updateUser, deleteAccount } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [editingBasic, setEditingBasic] = useState(false)
  const [editingSurvey, setEditingSurvey] = useState(false)
  
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
    interests: string[]
  }>({
    dateStyle: user?.surveyData?.dateStyle || "",
    contactStyle: user?.surveyData?.contactStyle || "",
    conflictStyle: user?.surveyData?.conflictStyle || "",
    spending: user?.surveyData?.spending || "",
    priority: user?.surveyData?.priority || "",
    agePreference: user?.surveyData?.agePreference || [],
    distancePreference: user?.surveyData?.distancePreference || "",
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

  const handleSaveBasic = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))

    updateUser(basicData)
    setIsLoading(false)
    setEditingBasic(false)

    toast({
      title: "프로필 수정 완료",
      description: "기본 정보가 성공적으로 업데이트되었습니다.",
    })
  }

  const handleSaveSurvey = async () => {
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

  return (
    <BackgroundLayout>
      {/* Header */}
      {user && (
        <Header
          onHomeClick={onHomeClick || onBack}
          onHistoryClick={onHistoryClick}
          onProfileClick={onProfileClick}
          onMbtiClick={onMbtiClick}
          onLogout={onLogout}
          currentView="profile"
        />
      )}

      <main className="pt-20 pb-10 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold">마이페이지</h1>
              <p className="text-muted-foreground text-sm">내 정보를 관리하고 수정하세요</p>
            </div>

        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <User className="w-10 h-10 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">{user?.nickname}</h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{user?.age}세</span>
                  <span>{user?.gender === "male" ? "남성" : "여성"}</span>
                  <span>{user?.region}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Thermometer className={`w-4 h-4 ${getTemperatureColor(user?.temperature || 36.5)}`} />
                  <span className={`font-semibold ${getTemperatureColor(user?.temperature || 36.5)}`}>
                    {user?.temperature?.toFixed(1) || "36.5"}°C
                  </span>
                  <span className="text-xs text-muted-foreground">매너 온도</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>기본 정보</CardTitle>
                <CardDescription>닉네임, 소개, MBTI</CardDescription>
              </div>
              {!editingBasic && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingBasic(true)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  수정
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {editingBasic ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nickname">닉네임</Label>
                  <Input
                    id="nickname"
                    value={basicData.nickname}
                    onChange={(e) => setBasicData({ ...basicData, nickname: e.target.value })}
                    className="bg-input"
                  />
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
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setBasicData({
                        nickname: user?.nickname || "",
                        bio: user?.bio || "",
                        mbti: user?.mbti || "",
                      })
                      setEditingBasic(false)
                    }}
                    className="flex-1"
                  >
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
              </div>
            ) : (
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Survey Data Card */}
        <Card className="mb-6">
          <CardHeader>
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
          <CardContent>
            {editingSurvey ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Phase 1. 나의 연애 DNA (About Me)</h3>

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
                  <h3 className="font-semibold text-sm">Phase 2. 내가 찾는 그 사람 (My Ideal Type)</h3>

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
                  <h3 className="font-semibold text-sm">Phase 3. 우리의 연결고리 (Interest Tags)</h3>

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
                                  interests: surveyData.interests.filter((i: string) => i !== opt.value),
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
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (user?.surveyData) {
                        setSurveyData({
                          dateStyle: user.surveyData.dateStyle || "",
                          contactStyle: user.surveyData.contactStyle || "",
                          conflictStyle: user.surveyData.conflictStyle || "",
                          spending: user.surveyData.spending || "",
                          priority: user.surveyData.priority || "",
                          agePreference: user.surveyData.agePreference || [],
                          distancePreference: user.surveyData.distancePreference || "",
                          interests: user.surveyData.interests || [],
                        })
                      }
                      setEditingSurvey(false)
                    }}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    저장
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
                    ??
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">Phase 1. 나의 연애 DNA (About Me)</h3>
                  <div className="grid gap-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{SURVEY_QUESTIONS.dateStyle.question}</span>
                      <span className="text-sm font-medium">{getAnswerLabel("dateStyle", surveyData.dateStyle)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{SURVEY_QUESTIONS.contactStyle.question}</span>
                      <span className="text-sm font-medium">{getAnswerLabel("contactStyle", surveyData.contactStyle)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{SURVEY_QUESTIONS.conflictStyle.question}</span>
                      <span className="text-sm font-medium">{getAnswerLabel("conflictStyle", surveyData.conflictStyle)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{SURVEY_QUESTIONS.spending.question}</span>
                      <span className="text-sm font-medium">{getAnswerLabel("spending", surveyData.spending)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">Phase 2. 내가 찾는 그 사람 (My Ideal Type)</h3>
                  <div className="grid gap-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{SURVEY_QUESTIONS.priority.question}</span>
                      <span className="text-sm font-medium">{getAnswerLabel("priority", surveyData.priority)}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">{SURVEY_QUESTIONS.agePreference.question}</span>
                      <p className="text-sm font-medium mt-1">{getAnswerLabel("agePreference", surveyData.agePreference)}</p>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{SURVEY_QUESTIONS.distancePreference.question}</span>
                      <span className="text-sm font-medium">{getAnswerLabel("distancePreference", surveyData.distancePreference)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">Phase 3. 우리의 연결고리 (Interest Tags)</h3>
                  <div className="grid gap-2">
                    <div>
                      <span className="text-sm text-muted-foreground">{SURVEY_QUESTIONS.interests.question}</span>
                      <p className="text-sm font-medium mt-1">{getAnswerLabel("interests", surveyData.interests)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">계정 삭제</CardTitle>
            <CardDescription>계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              계정 삭제
            </Button>
          </CardContent>
        </Card>
      </div>

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
      </main>
    </BackgroundLayout>
  )
}
