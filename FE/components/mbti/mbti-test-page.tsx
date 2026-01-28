"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Check, X } from "lucide-react"

interface MBTITestPageProps {
  onBack: () => void
  onComplete: (mbti: string) => void
  existingMbti?: string
  onViewResult?: (mbti: string) => void
  autoStart?: boolean
}

const testSections = [
  {
    dimension: ["E", "I"],
    questions: [
      {
        question: "연애할 때 나는?",
        options: [
          { label: "연인이랑 자주 연락하고 얘기해야 마음이 편하다", value: "E" },
          { label: "연락이 조금 없어도 각자 시간 있으면 괜찮다", value: "I" },
        ],
      },
      {
        question: "연인과 하루 종일 같이 있으면?",
        options: [
          { label: "헤어지기 아쉽고 더 같이 있고 싶다", value: "E" },
          { label: "즐겁지만 집에 가서 혼자 쉬고 싶다", value: "I" },
        ],
      },
      {
        question: "주말에 연인과 집에만 있다면?",
        options: [
          { label: "“우리 뭐라도 할까?”라는 생각이 든다", value: "E" },
          { label: "아무것도 안 해도 이 시간이 좋다", value: "I" },
        ],
      },
    ],
  },
  {
    dimension: ["F", "T"],
    questions: [
      {
        question: "연인이 힘들다고 말하면 나는?",
        options: [
          { label: "먼저 공감하고 위로해 주고 싶다", value: "F" },
          { label: "무슨 일인지 이유부터 알고 싶다", value: "T" },
        ],
      },
      {
        question: "싸운 뒤 더 중요하다고 느끼는 건?",
        options: [
          { label: "감정이 풀리고 분위기가 좋아지는 것", value: "F" },
          { label: "왜 싸웠는지 정리되는 것", value: "T" },
        ],
      },
      {
        question: "다툰 뒤에도 계속 생각나는 건?",
        options: [
          { label: "그때 했던 말, 표정, 분위기", value: "F" },
          { label: "아직 해결 안 된 문제", value: "T" },
        ],
      },
    ],
  },
  {
    dimension: ["P", "S"],
    questions: [
      {
        question: "데이트 약속은?",
        options: [
          { label: "미리 정해져 있어야 마음이 편하다", value: "P" },
          { label: "그날 기분 따라 정하는 게 좋다", value: "S" },
        ],
      },
      {
        question: "연인이 갑자기 약속을 바꾸면?",
        options: [
          { label: "당황스럽고 싫다", value: "P" },
          { label: "그럴 수도 있지 싶다", value: "S" },
        ],
      },
      {
        question: "연애에서 나를 힘들게 하는 건?",
        options: [
          { label: "계획 없이 흘러가는 관계", value: "P" },
          { label: "너무 정해진 관계", value: "S" },
        ],
      },
    ],
  },
  {
    dimension: ["D", "A"],
    questions: [
      {
        question: "내가 사랑받는다고 느낄 때는?",
        options: [
          { label: "말이나 표현을 자주 해줄 때", value: "D" },
          { label: "행동으로 챙겨줄 때", value: "A" },
        ],
      },
      {
        question: "연인에게 서운해지는 순간은?",
        options: [
          { label: "표현이 줄어들었을 때", value: "D" },
          { label: "약속이나 행동이 달라질 때", value: "A" },
        ],
      },
      {
        question: "더 못 참겠는 건?",
        options: [
          { label: "무슨 생각인지 말 안 해줄 때", value: "D" },
          { label: "말만 하고 안 바뀔 때", value: "A" },
        ],
      },
    ],
  },
]

export function MBTITestPage({ onBack, onComplete, existingMbti, onViewResult, autoStart }: MBTITestPageProps) {
  const [hasStarted, setHasStarted] = useState(false)
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [autoStarted, setAutoStarted] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const currentCategory = testSections[currentCategoryIndex]
  const currentQuestion = currentCategory.questions[currentQuestionIndex]
  const totalQuestions = testSections.reduce((sum, cat) => sum + cat.questions.length, 0)
  const answeredQuestions = Object.keys(answers).length
  const progress = (answeredQuestions / totalQuestions) * 100

  const questionKey = `${currentCategoryIndex}-${currentQuestionIndex}`
  const currentAnswer = answers[questionKey]

  const handleAnswer = (answer: string) => {
    setAnswers({ ...answers, [questionKey]: answer })
    setTimeout(() => {
      handleNext()
    }, 150)
  }

  const handleStart = () => {
    setHasStarted(true)
    setCurrentCategoryIndex(0)
    setCurrentQuestionIndex(0)
    setAnswers({})
  }

  const handleExitToStart = () => {
    setShowExitConfirm(false)
    setHasStarted(false)
    setCurrentCategoryIndex(0)
    setCurrentQuestionIndex(0)
    setAnswers({})
  }

  useEffect(() => {
    if (autoStart && !hasStarted && !autoStarted) {
      handleStart()
      setAutoStarted(true)
    }
  }, [autoStart, hasStarted, autoStarted])

  const calculateResult = () => {
    return testSections
      .map((section, sectionIndex) => {
        const [left, right] = section.dimension
        let leftCount = 0
        let rightCount = 0

        section.questions.forEach((_, questionIndex) => {
          const answer = answers[`${sectionIndex}-${questionIndex}`]
          if (answer === left) leftCount += 1
          if (answer === right) rightCount += 1
        })

        return leftCount >= rightCount ? left : right
      })
      .join("")
  }

  const handleNext = () => {
    if (currentQuestionIndex < currentCategory.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else if (currentCategoryIndex < testSections.length - 1) {
      setCurrentCategoryIndex(currentCategoryIndex + 1)
      setCurrentQuestionIndex(0)
    } else {
      // 테스트 완료 - MBTI 결과 계산
      const result = calculateResult()
      onComplete(result)
    }
  }

  const handleBack = () => {
    if (!hasStarted) {
      onBack()
      return
    }
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      return
    }
    if (currentCategoryIndex > 0) {
      const prevCategoryIndex = currentCategoryIndex - 1
      const prevCategory = testSections[prevCategoryIndex]
      setCurrentCategoryIndex(prevCategoryIndex)
      setCurrentQuestionIndex(prevCategory.questions.length - 1)
      return
    }
    setHasStarted(false)
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      {/* Stronger overlay to reduce background distraction */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-md" />
      <div className="relative container max-w-2xl mx-auto px-4 py-8">
        {!hasStarted ? (
          <Card className="bg-card/90 backdrop-blur shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={onBack} className="bg-card/50 backdrop-blur">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <CardTitle className="text-2xl">연애 가치관 테스트</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                12문항을 통해 연애 성향을 알아볼 수 있어요.
              </p>
              {existingMbti ? (
                <div className="space-y-3">
                  <Button onClick={handleStart} className="w-full h-12 text-base">
                    다시 테스트하기
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full h-12 text-base"
                    onClick={() => existingMbti && onViewResult?.(existingMbti)}
                  >
                    결과보기
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button onClick={handleStart} className="w-full h-12 text-base">
                    테스트 시작하기
                  </Button>
                  <Button variant="secondary" className="w-full h-12 text-base" onClick={onBack}>
                    홈으로 가기
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl font-bold text-foreground">연애 가치관 테스트</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBack}
                  className="bg-card/50 backdrop-blur"
                  aria-label="홈으로 이동"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <Progress value={progress} className="h-2 mt-3" />
            </div>

            {/* Question Card */}
            <Card className="bg-card/90 backdrop-blur shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = currentAnswer === option.value

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleAnswer(option.value)}
                      className={`w-full h-12 px-4 rounded-lg border-2 transition-all text-left text-base font-normal flex items-center justify-between ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-border bg-card/50 hover:border-primary/50 hover:bg-card/80"
                      }`}
                    >
                      <span>{option.label}</span>
                      {isSelected && <Check className="w-5 h-5 text-primary" />}
                    </button>
                  )
                })}
              </CardContent>
            </Card>

            <div className="mt-6 flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-12 w-12 rounded-full bg-card/60 backdrop-blur border border-border/60 text-xl"
                aria-label="뒤로가기"
              >
                ←
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                disabled={!currentAnswer}
                className="h-12 w-12 rounded-full bg-card/60 backdrop-blur border border-border/60 text-xl disabled:opacity-40"
                aria-label="앞으로가기"
              >
                →
              </Button>
            </div>
          </>
        )}
      </div>

      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent className="sm:max-w-sm bg-background">
          <DialogHeader>
            <DialogTitle className="text-center">테스트 종료</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="mb-6 text-sm text-muted-foreground">테스트를 종료하시겠습니까?</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowExitConfirm(false)} className="flex-1">
                취소
              </Button>
              <Button onClick={handleExitToStart} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                종료하기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
