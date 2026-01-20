"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Heart, Loader2 } from "lucide-react"

interface BalanceGameOverlayProps {
  onClose: () => void
}

const QUESTIONS = [
  {
    section: "에너지의 방향",
    question: "연애할 때 나는?",
    optionA: "연인이랑 자주 연락하고 얘기해야 마음이 편하다",
    optionB: "연락이 조금 없어도 각자 시간 있으면 괜찮다",
  },
  {
    section: "에너지의 방향",
    question: "연인과 하루 종일 같이 있으면?",
    optionA: "헤어지기 아쉽고 더 같이 있고 싶다",
    optionB: "즐겁지만 집에 가서 혼자 쉬고 싶다",
  },
  {
    section: "에너지의 방향",
    question: "주말에 연인과 집에만 있다면?",
    optionA: "우리 뭐라도 할까? 라는 생각이 든다",
    optionB: "아무것도 안 해도 이 시간이 좋다",
  },
  {
    section: "판단과 대화",
    question: "연인이 힘들다고 말하면 나는?",
    optionA: "먼저 공감하고 위로해 주고 싶다",
    optionB: "무슨 일인지 이유부터 알고 싶다",
  },
  {
    section: "판단과 대화",
    question: "싸운 뒤 더 중요하다고 느끼는 건?",
    optionA: "감정이 풀리고 분위기가 좋아지는 것",
    optionB: "왜 싸웠는지 정리되는 것",
  },
  {
    section: "판단과 대화",
    question: "다툰 뒤에도 계속 생각나는 건?",
    optionA: "그때 했던 말, 표정, 분위기",
    optionB: "아직 해결 안 된 문제",
  },
  {
    section: "라이프스타일",
    question: "데이트 약속은?",
    optionA: "미리 정해져 있어야 마음이 편하다",
    optionB: "그날 기분 따라 정하는 게 좋다",
  },
  {
    section: "라이프스타일",
    question: "연인이 갑자기 약속을 바꾸면?",
    optionA: "당황스럽고 싫다",
    optionB: "그럴 수도 있지 싶다",
  },
  {
    section: "라이프스타일",
    question: "연애에서 나를 힘들게 하는 건?",
    optionA: "계획 없이 흘러가는 관계",
    optionB: "너무 정해진 관계",
  },
  {
    section: "애정 표현 방식",
    question: "내가 사랑받는다고 느낄 때는?",
    optionA: "말이나 표현을 자주 해줄 때",
    optionB: "행동으로 챙겨줄 때",
  },
  {
    section: "애정 표현 방식",
    question: "연인에게 서운해지는 순간은?",
    optionA: "표현이 줄어들었을 때",
    optionB: "약속이나 행동이 달라질 때",
  },
  {
    section: "애정 표현 방식",
    question: "더 못 참겠는 건?",
    optionA: "무슨 생각인지 말 안 해줄 때",
    optionB: "말만 하고 안 바뀔 때",
  },
]

export function BalanceGameOverlay({ onClose }: BalanceGameOverlayProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [myChoice, setMyChoice] = useState<"A" | "B" | null>(null)
  const [partnerChoice, setPartnerChoice] = useState<"A" | "B" | null>(null)
  const [isWaiting, setIsWaiting] = useState(false)
  const [showResult, setShowResult] = useState(false)

  const question = QUESTIONS[currentQuestion]

  const handleChoice = (choice: "A" | "B") => {
    setMyChoice(choice)
    setIsWaiting(true)

    // Simulate partner choosing
    setTimeout(() => {
      const partnerPick = Math.random() > 0.5 ? "A" : "B"
      setPartnerChoice(partnerPick)
      setIsWaiting(false)
      setShowResult(true)
    }, 1500)
  }

  const handleNext = () => {
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
      setMyChoice(null)
      setPartnerChoice(null)
      setShowResult(false)
    } else {
      onClose()
    }
  }

  const isMatch = myChoice === partnerChoice

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-background rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">밸런스 게임</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {currentQuestion + 1} / {QUESTIONS.length}
            </span>
            <button onClick={onClose}>
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <h4 className="text-xl font-bold text-center mb-6">{question.question}</h4>

          {!showResult ? (
            <div className="space-y-3">
              <Button
                variant={myChoice === "A" ? "default" : "outline"}
                className={`w-full py-6 text-left justify-start ${myChoice === "A" ? "bg-primary text-primary-foreground" : ""}`}
                onClick={() => !isWaiting && handleChoice("A")}
                disabled={isWaiting}
              >
                <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3 flex-shrink-0">
                  A
                </span>
                {question.optionA}
              </Button>
              <Button
                variant={myChoice === "B" ? "default" : "outline"}
                className={`w-full py-6 text-left justify-start ${myChoice === "B" ? "bg-primary text-primary-foreground" : ""}`}
                onClick={() => !isWaiting && handleChoice("B")}
                disabled={isWaiting}
              >
                <span className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center mr-3 flex-shrink-0">
                  B
                </span>
                {question.optionB}
              </Button>

              {isWaiting && (
                <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  상대방 선택 대기 중...
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl text-center ${isMatch ? "bg-green-100 border-2 border-green-500" : "bg-accent/30"}`}>
                {isMatch ? (
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                      <span className="font-semibold text-green-700">취향이 같아요!</span>
                    </div>
                    <p className="text-sm text-green-600">이 주제로 대화를 나눠보세요</p>
                  </div>
                ) : (
                  <div>
                    <span className="font-semibold text-muted-foreground">서로 다른 취향이네요</span>
                    <p className="text-sm text-muted-foreground mt-1">다양성도 좋아요!</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-card text-center">
                  <p className="text-sm text-muted-foreground mb-1">나의 선택</p>
                  <p className="font-semibold">{myChoice}</p>
                </div>
                <div className="p-4 rounded-xl bg-card text-center">
                  <p className="text-sm text-muted-foreground mb-1">상대방 선택</p>
                  <p className="font-semibold">{partnerChoice}</p>
                </div>
              </div>

              <Button onClick={handleNext} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {currentQuestion < QUESTIONS.length - 1 ? "다음 질문" : "게임 종료"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
