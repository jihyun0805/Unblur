"use client"

import { useState } from "react"
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
    category: "요즘 감성 밸런스 (Z세대/밈 감성)",
    questions: [
      { question: "카톡 프사 안 바꿈 vs 프사 자주 바꿈", options: ["카톡 프사 안 바꿈", "프사 자주 바꿈"] },
      { question: "인스타 안 올림 vs 스토리 매일 올림", options: ["인스타 안 올림", "스토리 매일 올림"] },
      { question: "사진 보정 과함 vs 보정 거의 없음", options: ["사진 보정 과함", "보정 거의 없음"] },
      { question: "셀카 안 찍음 vs 셀카 장인", options: ["셀카 안 찍음", "셀카 장인"] },
      { question: "SNS 눈팅만 vs 댓글 요정", options: ["SNS 눈팅만", "댓글 요정"] },
    ],
  },
  {
    category: "스타일 & 패션 밸런스",
    questions: [
      { question: "무채톤 올블랙 vs 컬러 포인트 필수", options: ["무채톤 올블랙", "컬러 포인트 필수"] },
      { question: "편한 게 최고 vs 불편해도 스타일", options: ["편한 게 최고", "불편해도 스타일"] },
      { question: "꾸안꾸 vs 꾸꾸꾸", options: ["꾸안꾸", "꾸꾸꾸"] },
      { question: "운동화만 신기 vs 상황별 신발", options: ["운동화만 신기", "상황별 신발"] },
      { question: "가방 하나 돌려쓰기 vs 코디별 가방", options: ["가방 하나 돌려쓰기", "코디별 가방"] },
    ],
  },
  {
    category: "성격 드러나는 밸런스",
    questions: [
      { question: "생각 많고 말 적음 vs 생각 적고 말 많음", options: ["생각 많고 말 적음", "생각 적고 말 많음"] },
      { question: "눈치 빠른 편 vs 솔직한 편", options: ["눈치 빠른 편", "솔직한 편"] },
      { question: "완벽하려다 미룸 vs 대충이라도 바로 함", options: ["완벽하려다 미룸", "대충이라도 바로 함"] },
      { question: "혼자 있어야 충전 vs 사람 있어야 충전", options: ["혼자 있어야 충전", "사람 있어야 충전"] },
      { question: "결정 오래 vs 결정 빠름", options: ["결정 오래", "결정 빠름"] },
    ],
  },
  {
    category: "생활 습관 밸런스",
    questions: [
      { question: "알람 10개 vs 알람 1개", options: ["알람 10개", "알람 1개"] },
      { question: "미루다 몰아서 vs 조금씩 꾸준히", options: ["미루다 몰아서", "조금씩 꾸준히"] },
      {
        question: "방은 더러운데 머릿속 정리됨 vs 방은 깨끗한데 머릿속 복잡",
        options: ["방은 더러운데 머릿속 정리됨", "방은 깨끗한데 머릿속 복잡"],
      },
      {
        question: "집 오면 바로 눕기 vs 집 오면 할 일 다 하고 눕기",
        options: ["집 오면 바로 눕기", "집 오면 할 일 다 하고 눕기"],
      },
      { question: "야식 포기 못함 vs 야식 안 먹음", options: ["야식 포기 못함", "야식 안 먹음"] },
    ],
  },
  {
    category: "음식 취향 밸런스",
    questions: [
      { question: "평생 같은 메뉴 vs 매번 새로운 메뉴", options: ["평생 같은 메뉴", "매번 새로운 메뉴"] },
      { question: "맛집 줄 서기 vs 근처 아무 데나", options: ["맛집 줄 서기", "근처 아무 데나"] },
      { question: "양 많고 평범 vs 양 적고 맛집", options: ["양 많고 평범", "양 적고 맛집"] },
      { question: "단짠 러버 vs 담백파", options: ["단짠 러버", "담백파"] },
      { question: "배불러도 디저트 vs 디저트는 배 따로", options: ["배불러도 디저트", "디저트는 배 따로"] },
    ],
  },
  {
    category: "여행 & 여가 밸런스",
    questions: [
      { question: "여행 일정 빼곡 vs 발 닿는 대로", options: ["여행 일정 빼곡", "발 닿는 대로"] },
      { question: "사진 100장 vs 사진 거의 안 찍음", options: ["사진 100장", "사진 거의 안 찍음"] },
      { question: "힐링 여행 vs 관광 풀코스", options: ["힐링 여행", "관광 풀코스"] },
      { question: "혼자 여행 vs 여럿이 여행", options: ["혼자 여행", "여럿이 여행"] },
      { question: "숙소 중요 vs 밖에서 노는 게 중요", options: ["숙소 중요", "밖에서 노는 게 중요"] },
    ],
  },
  {
    category: "디지털 & 미디어 밸런스",
    questions: [
      { question: "유튜브 알고리즘 신뢰 vs 직접 검색", options: ["유튜브 알고리즘 신뢰", "직접 검색"] },
      { question: "영상 배속 필수 vs 정속 시청", options: ["영상 배속 필수", "정속 시청"] },
      {
        question: "넷플릭스 정주행 vs 짧은 영상 무한 스크롤",
        options: ["넷플릭스 정주행", "짧은 영상 무한 스크롤"],
      },
      { question: "댓글 먼저 봄 vs 영상만 봄", options: ["댓글 먼저 봄", "영상만 봄"] },
      { question: "플레이리스트 있음 vs 그때그때 검색", options: ["플레이리스트 있음", "그때그때 검색"] },
    ],
  },
  {
    category: "극단 밸런스",
    questions: [
      { question: "평생 같은 노래 vs 평생 랜덤 노래", options: ["평생 같은 노래", "평생 랜덤 노래"] },
      { question: "여름에 패딩 vs 겨울에 반팔", options: ["여름에 패딩", "겨울에 반팔"] },
      {
        question: "사진 찍힐 때마다 눈 감기 vs 항상 어색한 포즈",
        options: ["사진 찍힐 때마다 눈 감기", "항상 어색한 포즈"],
      },
      { question: "웃음 참기 불가 vs 리액션 로봇", options: ["웃음 참기 불가", "리액션 로봇"] },
      { question: "말하다가 결론 없음 vs 결론만 말함", options: ["말하다가 결론 없음", "결론만 말함"] },
    ],
  },
]

export function MBTITestPage({ onBack, onComplete }: MBTITestPageProps) {
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
      // 테스트 완료 - MBTI 결과 계산
      const result = "Custom-MBTI" // 밸런스 게임이므로 MBTI가 아닌 커스텀 결과
      onComplete(result)
    }
  }

  const canGoNext = currentAnswer !== undefined

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      {/* Stronger overlay to reduce background distraction */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-md" />
      <div className="relative container max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={onBack} className="bg-card/50 backdrop-blur">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground mb-2">MBTI 밸런스 게임</h1>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {answeredQuestions} / {totalQuestions} 질문 완료
            </p>
          </div>
        </div>

        {/* Question Card */}
        <Card className="bg-card/90 backdrop-blur shadow-lg">
          <CardHeader>
            <div className="text-sm text-muted-foreground mb-2">{currentCategory.category}</div>
            <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = currentAnswer === option

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleAnswer(option)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-border bg-card/50 hover:border-primary/50 hover:bg-card/80"
                  }`}
                >
                  <span className="font-medium">{option}</span>
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
      </div>
    </div>
  )
}
