"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Check } from "lucide-react"

interface MBTITestPageProps {
  onBack: () => void
  onComplete: (mbti: string) => void
}

const mbtiQuestions = [
  {
    category: "A",
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
          { label: "\"우리 뭐라도 할까?\"라는 생각이 든다", value: "E" },
          { label: "아무것도 안 해도 이 시간이 좋다", value: "I" },
        ],
      },
    ],
  },
  {
    category: "B",
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
    category: "C",
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
    category: "D",
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

export function MBTITestPage({ onBack, onComplete }: MBTITestPageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [hasStarted, setHasStarted] = useState(false)
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const currentCategory = mbtiQuestions[currentCategoryIndex]
  const currentQuestion = currentCategory.questions[currentQuestionIndex]
  const totalQuestions = mbtiQuestions.reduce((sum, cat) => sum + cat.questions.length, 0)
  const answeredQuestions = Object.keys(answers).length
  const progress = (answeredQuestions / totalQuestions) * 100

  const questionKey = `${currentCategoryIndex}-${currentQuestionIndex}`
  const currentAnswer = answers[questionKey]

  const handleAnswer = (answer: string) => {
    setAnswers({ ...answers, [questionKey]: answer })
  }

  const handleNext = () => {
    if (currentQuestionIndex < currentCategory.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else if (currentCategoryIndex < mbtiQuestions.length - 1) {
      setCurrentCategoryIndex(currentCategoryIndex + 1)
      setCurrentQuestionIndex(0)
    } else {
      if (Object.keys(answers).length < totalQuestions) {
        return
      }
      const entries = Object.values(answers)
      const counts = entries.reduce<Record<string, number>>((acc, value) => {
        acc[value] = (acc[value] || 0) + 1
        return acc
      }, {})

      const energy = (counts.E || 0) >= (counts.I || 0) ? "E" : "I"
      const judgment = (counts.F || 0) >= (counts.T || 0) ? "F" : "T"
      const lifestyle = (counts.P || 0) >= (counts.S || 0) ? "P" : "S"
      const affection = (counts.D || 0) >= (counts.A || 0) ? "D" : "A"

      const result = `${energy}${judgment}${lifestyle}${affection}`
      onComplete(result)
    }
  }

  const canGoNext = currentAnswer !== undefined
  const savedResult = user?.mbti?.toUpperCase()
  const handleBack = () => {
    if (hasStarted) {
      setHasStarted(false)
      setCurrentCategoryIndex(0)
      setCurrentQuestionIndex(0)
      setAnswers({})
      return
    }
    onBack()
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      {/* Sunset Background */}
      <div className="fixed inset-0 z-0">
        <img
          src="/sunset-ocean.jpg"
          alt="Sunset background"
          className="w-full h-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-white/30" />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-0" />

      {/* Content */}
      <div className="relative z-10 container max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={handleBack} className="bg-card/50 backdrop-blur">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground mb-2">연애 가치관 테스트</h1>
            {hasStarted && (
              <>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  {answeredQuestions} / {totalQuestions} 질문 완료
                </p>
              </>
            )}
          </div>
        </div>

        {!hasStarted ? (
          <Card className="bg-card/80 backdrop-blur shadow-lg">
            <CardContent className="pt-2">
              <div className="space-y-3">
                <Button onClick={() => setHasStarted(true)} className="w-full">
                  {savedResult ? "테스트 다시 해보기" : "테스트 시작하기"}
                </Button>
                {savedResult && (
                  <Button
                    onClick={() => router.push(`/mbti/result?type=${encodeURIComponent(savedResult)}`)}
                    variant="secondary"
                    className="w-full"
                  >
                    결과 보러가기
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card/80 backdrop-blur shadow-lg">
            <CardHeader>
              {/* Category intentionally hidden */}
              <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = currentAnswer === option.value

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleAnswer(option.value)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border bg-card/50 hover:border-primary/50 hover:bg-card/80"
                    }`}
                  >
                    <span className="font-medium">{option.label}</span>
                    {isSelected && <Check className="w-5 h-5 text-primary" />}
                  </button>
                )
              })}

              <div className="pt-4">
                <Button
                  onClick={handleNext}
                  disabled={!canGoNext}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {currentCategoryIndex === mbtiQuestions.length - 1 &&
                  currentQuestionIndex === currentCategory.questions.length - 1
                    ? "완료"
                    : "다음"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
